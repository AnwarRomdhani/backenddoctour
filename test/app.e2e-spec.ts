import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let userId: number;
  const timestamp = Date.now();

  const generateUniqueEmail = (baseEmail: string) => {
    const [localPart, domain] = baseEmail.split('@');
    return `${localPart}+${timestamp}@${domain}`;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Endpoints', () => {
    describe('POST /auth/register', () => {
      it('should register a new user with required fields', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: generateUniqueEmail('test@example.com'),
            username: `testuser${timestamp}`,
            password: 'password123',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('email');
            expect(res.body).toHaveProperty('username');
            expect(res.body).not.toHaveProperty('password');
            expect(res.body).toHaveProperty('coinBalance', 0);
            userId = res.body.id;
          });
      });

      it('should register a user with profile fields', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: generateUniqueEmail('profile@example.com'),
            username: `profileuser${timestamp}`,
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            phone: '123456789',
            address: '123 Main St',
            cin: '12345678',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.firstName).toBe('John');
            expect(res.body.lastName).toBe('Doe');
            expect(res.body.phone).toBe('123456789');
            expect(res.body.address).toBe('123 Main St');
            expect(res.body.cin).toBe('12345678');
            expect(res.body.coinBalance).toBe(0);
          });
      });

      it('should reject duplicate email', () => {
        const testEmail = generateUniqueEmail('duplicate@example.com');
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: testEmail,
            username: `dupuser1${timestamp}`,
            password: 'password123',
          })
          .then(() => {
            return request(app.getHttpServer())
              .post('/auth/register')
              .send({
                email: testEmail,
                username: `dupuser2${timestamp}`,
                password: 'password123',
              })
              .expect(400)
              .expect((res) => {
                expect(res.body.message).toContain('Email already in use');
              });
          });
      });

      it('should reject duplicate username', () => {
        const testUsername = `dupusername${timestamp}`;
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: generateUniqueEmail('dupuser1@example.com'),
            username: testUsername,
            password: 'password123',
          })
          .then(() => {
            return request(app.getHttpServer())
              .post('/auth/register')
              .send({
                email: generateUniqueEmail('dupuser2@example.com'),
                username: testUsername,
                password: 'password123',
              })
              .expect(400)
              .expect((res) => {
                expect(res.body.message).toContain('Username already in use');
              });
          });
      });

      it('should reject short password', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: generateUniqueEmail('short@example.com'),
            username: `shortpass${timestamp}`,
            password: '123',
          })
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('Password must be at least 6 characters');
          });
      });

      it('should reject invalid CIN format', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: generateUniqueEmail('cin@example.com'),
            username: `cinuser${timestamp}`,
            password: 'password123',
            cin: 'invalid',
          })
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('CIN must be exactly 8 digits');
          });
      });
    });

    describe('POST /auth/login', () => {
      const testEmail = generateUniqueEmail('login@example.com');
      const testUsername = `loginuser${timestamp}`;

      beforeAll(async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: testEmail,
            username: testUsername,
            password: 'password123',
          });
      });

      it('should login and return access token', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testEmail,
            password: 'password123',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testEmail);
            expect(res.body.user).not.toHaveProperty('password');
            expect(res.body.user).toHaveProperty('coinBalance');
            accessToken = res.body.accessToken;
          });
      });

      it('should reject invalid email', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'password123',
          })
          .expect(401)
          .expect((res) => {
            expect(res.body.message).toContain('Invalid email or password');
          });
      });

      it('should reject wrong password', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testEmail,
            password: 'wrongpassword',
          })
          .expect(401)
          .expect((res) => {
            expect(res.body.message).toContain('Invalid email or password');
          });
      });
    });
  });

  describe('User Endpoints', () => {
    describe('GET /users', () => {
      it('should list all users when authenticated', () => {
        return request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            const user = res.body.find((u) => u.email === 'test@example.com');
            expect(user).toBeDefined();
            expect(user).toHaveProperty('coinBalance');
          });
      });

      it('should reject request without token', () => {
        return request(app.getHttpServer())
          .get('/users')
          .expect(401);
      });

      it('should reject request with invalid token', () => {
        return request(app.getHttpServer())
          .get('/users')
          .set('Authorization', 'Bearer invalid.token.here')
          .expect(401);
      });
    });

    describe('GET /users/:id', () => {
      it('should get user by id when authenticated', () => {
        return request(app.getHttpServer())
          .get(`/users/${userId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(userId);
            expect(res.body).toHaveProperty('email');
            expect(res.body).toHaveProperty('coinBalance');
          });
      });

      it('should return 404 for non-existent user', () => {
        return request(app.getHttpServer())
          .get('/users/99999')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });

      it('should reject without authentication', () => {
        return request(app.getHttpServer())
          .get(`/users/${userId}`)
          .expect(401);
      });
    });

    describe('POST /users', () => {
      it('should create a new user (public endpoint)', () => {
        return request(app.getHttpServer())
          .post('/users')
          .send({
            email: generateUniqueEmail('newuser@example.com'),
            username: `newuser${timestamp}`,
            password: 'password123',
            firstName: 'Jane',
            lastName: 'Smith',
            coinBalance: 100,
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('email');
            expect(res.body.firstName).toBe('Jane');
            expect(res.body.coinBalance).toBe(100);
          });
      });

      it('should create user with default coinBalance if not provided', () => {
        return request(app.getHttpServer())
          .post('/users')
          .send({
            email: generateUniqueEmail('defaultcoin@example.com'),
            username: `defaultcoin${timestamp}`,
            password: 'password123',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.coinBalance).toBe(0);
          });
      });
    });

    describe('PATCH /users/:id', () => {
      it('should update user when authenticated', () => {
        return request(app.getHttpServer())
          .patch(`/users/${userId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            firstName: 'UpdatedName',
            phone: '9876543210',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.firstName).toBe('UpdatedName');
            expect(res.body.phone).toBe('9876543210');
            expect(res.body).toHaveProperty('email');
          });
      });

      it('should update coinBalance', () => {
        return request(app.getHttpServer())
          .patch(`/users/${userId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            coinBalance: 500,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.coinBalance).toBe(500);
          });
      });

      it('should reject update without authentication', () => {
        return request(app.getHttpServer())
          .patch(`/users/${userId}`)
          .send({
            firstName: 'Hacker',
          })
          .expect(401);
      });
    });

    describe('DELETE /users/:id', () => {
      let deleteUserId: number;

      beforeAll(async () => {
        const registerRes = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: generateUniqueEmail('delete@example.com'),
            username: `deleteuser${timestamp}`,
            password: 'password123',
          });
        deleteUserId = registerRes.body.id;
      });

      it('should delete user when authenticated', () => {
        return request(app.getHttpServer())
          .delete(`/users/${deleteUserId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('email');
          });
      });

      it('should verify user is deleted', () => {
        return request(app.getHttpServer())
          .get(`/users/${deleteUserId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });

      it('should reject delete without authentication', () => {
        return request(app.getHttpServer())
          .delete(`/users/${userId}`)
          .expect(401);
      });
    });
  });
});

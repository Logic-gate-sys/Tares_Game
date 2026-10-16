import { test, expect, describe,beforeEach, vi } from 'vitest'; 
import request from 'supertest'; 
import { app } from '../../src/app'
import { createTestUser } from '../helpers/testHelpers';
import { pool } from '../setups/globalSetup';


describe("AUTH: /api/auth", () => {
  
  describe("POST: /api/auth", () => {
    test("mock api test", async () => {
      const getResults = vi.fn();
      getResults.mockResolvedValue({ status:201, data: { email: 'someone@gmail.com', password: 'someone', fakeToken: 'tokenherer' },});
      getResults.mockRejectedValue({ error: 'Invalid values', status: 500 });

      expect(getResults().Rejects).toHaveProperty('error', 'Invalid values');
      expect(getResults()).toBeDefined(); 
    })
    // Each test needs to start from a clean sheet to verify independent app logic. 
    beforeEach(async () => {
      // clean user table before each test
      await pool.query(`DELETE * FROM users`)
    })
    test("User creates account with valid details", async () => {
      const res = await request(app)
        .post("/api/users/register")
        .send({
          email: "test@gmail.com",
          username: "testman",
          password: "testman2",
          playerLevel: "2",
          rank: "3",
          bio: "My humble bio",
          bgClass: "bg-yellow-400",
          avatarUrl: "https://cloudinary.com/smaple/test-avatar"
        })
        .expect(200)

      expect(res.status).toBe(201);
      expect(res.body).not.toBeUndefined();
    });

    test("Rejects invalid request data", async () => {
      const res = await request(app)
        .post("/api/users/register")
        .send({
          email: "test@gmail.com",
          username: "testman",
          playerLevel: "2",
          rank: "3",
          bio: "My humble bio",
          bgClass: "bg-yellow-400",
          avatarUrl: "https://cloudinary.com/smaple/test-avatar"
        })
        .expect(400)

      expect(res.status).toBe(400);
      expect(res.body).not.toBeUndefined();
    })
  });

  describe("POST: /api/users/login", () => {
    beforeEach(async () => {
      // clean user table before each test
      await pool.query(`DELETE * FROM users`)
    })
    test("User is able to login with valid details", async () => {
      const {email, rawPassword} = await createTestUser()
      const res = await request(app)
        .post("/api/users/register")
        .send({
          email: email,
          password: rawPassword,
        })
        .expect(200)

      expect(res.status).toBe(201);
      expect(res.body).not.toBeUndefined();
    })
  })

})

import { test, expect, describe} from 'vitest';
import request from 'supertest';
import { app } from '../../src/app'
import { createTestUser } from '../helpers/testHelpers';



describe("User Management & Stats", () => {
  describe("GET: /api/leaderboard", () => {
    test("Returns leaderboard stats", async () => {
      await createTestUser();
      const res = await request(app)
        .get("/api/v1/users/leaderboard")
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data).not.toHaveProperty('password');
    });
  });

  describe("GET: /users/me/:id", () => {
    test("Returns user profile upon authorisation", async () => {
      const { email, rawPassword } = await createTestUser();
      //login
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email, password: rawPassword })
        .expect(200)

      const { id } = res.body.user;
      const authHeader = { authorization: `Bearer ${res.body.token}` }
      // use authenticated token to view profile of users
      const profileRes = await request(app)
        .get(`/api/v1/users/me/${id}`)
        .set(authHeader)
        .expect(200)

      console.log(profileRes.body);
      expect(profileRes.body).not.toBeUndefined();
    });
  });
})

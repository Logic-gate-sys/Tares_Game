import { test, expect, describe } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app'
import { createTestUser } from '../helpers/testHelpers';
import { createToken } from '#utils/crypto';


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
      // use authenticated token to view profile of users
      const profileRes = await request(app)
        .get(`/api/v1/users/${id}/profile`)
        .set('authorization', `Bearer ${res.body.token}`)
        .expect(200)

      expect(profileRes.body).not.toBeUndefined();
    });
  });

  describe("PATCH: /users/profile", () => {
    test("Updates user with valid details", async () => {
      const {id, email,username } = await createTestUser();
      const token =  createToken({ id, email, username } )
      // update user's username
      const res = await request(app)
        .patch("/api/v1/users/profile")
        .set('authorization', `Bearer ${token}`)
        .send({ username: 'newUsername' })
        .expect(200)

    })
  })
})

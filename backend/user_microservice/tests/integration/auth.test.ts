import { test, expect, describe, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app'
import { createTestUser } from '../helpers/testHelpers';
import { Buffer } from 'node:buffer';
import { upload } from '#utils/uploader';



vi.mock("#utils/uploader", () => ({
  upload: vi.fn()
}));

describe("SIGNUP & LOGIN WORKFLOW", () => {
  beforeEach(() => {
    // mocks a cleared because they remember past data and return values which can be problematic
    vi.clearAllMocks();
    vi.mocked(upload).mockResolvedValue("https://cloudinary.com/smaple/test-avatar")
  })

  describe("POST: auth/signup", () => {
    test("User creates account with valid details", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .field('email', 'jane@example.com')
        .field('username', 'janedoe')
        .field('password', 'supersecret123')
        .field('playerLevel', '42')
        .field('rank', 'Diamond')
        .field('bio', 'My humble bio')
        .field('bgClass', 'bg-yellow-400')
        .attach("avatar", Buffer.from("fake-buffer-for-image"), { filename: "profile.png", contentType: "image/png" })
        .expect(201)

      if (res.error) console.error("Error: ", res.error);
      expect(upload).toHaveBeenCalled();
      expect(res.body).not.toBeUndefined();
      expect(res.body).toHaveProperty("user");
      expect(res.body).toHaveProperty("token");
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
    });

    test("Invalid signup request body should be rejected", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .field('email', 'jane@example.com')
        .field('username', 'janedoe')
        .field('playerLevel', '42')
        .field('rank', 'Diamond')
        .field('bio', 'My humble bio')
        .field('bgClass', 'bg-yellow-400')
        .attach("avatar", Buffer.from("fake-buffer-for-image"), { filename: "profile.png", contentType: "image/png" })
        .expect(400);

      expect(res.status).toBe(400);
      expect(res.body).not.toBeUndefined();
    })
  });

  describe("POST: auth/login", () => {
    test("User is able to login with valid details", async () => {
      const { email, rawPassword } = await createTestUser();
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: email,
          password: { plain_text: rawPassword },
        })
        .expect(200)

      expect(res.body).not.toBeUndefined();
    });
    test("Should not allow login with invalid password", async () => {
      const { email } = await createTestUser();
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: email,
        })
        .expect(400)

      expect(res.body).toHaveProperty("message", "Invalid request body");
      expect(res.body).toHaveProperty("details")
    })


    test("Should not allow login with invalid email", async () => {
      const { rawPassword } = await createTestUser();
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "someone.now@gmail.com",
          password: { plain_text: rawPassword },
        })
        .expect(404)
      expect(res.body).not.toBeUndefined();
    });

    test("Should reject invalid body schema", async () => {
      const { email } = await createTestUser();
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: email,
        })
        .expect(400)

      expect(res.body).not.toBeUndefined();
    });
  });

  describe("POST: /api/auth/password-reset", () => {
    test("User should be able to get reset password link with valid details", async () => {
      //create user
      const { email } = await createTestUser();
      const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: email })
        .expect(200);
      expect(res.body).toHaveProperty("resetToken");
    });

    test("User should be able to reset their passwords", async () => {
      //create user
      const { email } = await createTestUser();
      const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: email })
        .expect(200);
      expect(res.body).toHaveProperty("resetToken");
      expect(res.body).toHaveProperty("message", )
      expect(res.body).toHaveProperty("link");

      // actual reset routes
      const resetRes = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({ token: res.body.resetToken, password: "my-newPassword94092" })
        .expect(200)
       console.log("RES: ", resetRes.body)
      expect(resetRes.body).toHaveProperty("message", 'Password reset successfully, you can login now' )
    })
  })
})

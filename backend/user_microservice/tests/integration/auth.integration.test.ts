import { test, expect, describe} from 'vitest'; 
import request from 'supertest'; 
import { app } from '../../src/app'
import { createTestUser } from '../helpers/testHelpers';


describe("User Signup & Login Workflows Tests", () => {
  
  describe("POST: auth/signup", () => {
    test("User creates account with valid details", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
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
        .post("/api/v1/auth/register")
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

  describe("POST: auth/login", () => {
    test("User is able to login with valid details", async () => {
      const {email, rawPassword} = await createTestUser()
      const res = await request(app)
        .post("/api/v1/auth/login")
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
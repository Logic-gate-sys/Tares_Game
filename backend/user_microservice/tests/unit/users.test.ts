import { beforeEach, describe, expect, it, test, vi } from 'vitest';
import { confirmPasswordReset, createUser, resetPassword, signIn, signUp, viewUserProfile } from '#repositories/users';
import { SignupData } from '#schemas/auth';
import { createToken, hashPassword, verifyPassword, verifyToken } from '#utils/crypto';
import { hash } from 'bcrypt';
import { id } from 'zod/v4/locales';

const testUser: SignupData = {
  email: 'someone@gmail.com',
  username: 'someone',
  password: 'unhashed-password',
  playerLevel: 'unknown',
  rank: '1',
  bio: 'My name is someone and I am so cool',
  bgClass: 'gree-yellowish',
  avatarUrl: 'https://cloudinary.com/my-photoes/jams'
}

const testPayload = { email: 'someone@gmail.com', username: 'someone', id: 'i403040' }

describe("User utilities & functions tests: ", () => {
    test("Should create user into db given valid details", async () => {
      const user = await createUser({ ...testUser, password: await hashPassword(testUser.password) });
      expect(user?.email).toBe(testUser.email)
    });

  test("Should verify user password correctly", async () => {
    const hashedPassword = await hashPassword(testUser.password);
    expect(verifyPassword(testUser.password, hashedPassword))
  });

  test("Should create and verify user acess token correct", async () => {
    const token = createToken(testPayload, 1000 * 60 * 15);
    expect(token.split(".").length).toBe(3);

    const { username, email, pLevel } = verifyToken(token);
    expect(username).toBe(testUser.username);
  });

  test("Should reject invalid tokens: ", () => {
    const token = createToken(testPayload, 1000 * 60 * 15);
    expect(token.split(".").length).toBe(3);
    expect(() => verifyToken(token.slice(0, 18))).toThrow('jwt malformed');
  });

  test("Should reject expire token", () => {
    const token = createToken(testPayload, 1000);
    expect(token.split(".").length).toBe(3);
    function isValidToken(){
      return verifyToken(token.slice(0, 18))
    }
    expect(() => setTimeout(isValidToken, 2000)).toThrow('Expired token')
  })
})

import {  describe, expect,  test, } from 'vitest';
import {  createUser} from '#repositories/users';
import { SignupData } from '#schemas/auth';
import { createToken, hashPassword, verifyPassword, verifyToken } from '#utils/crypto';


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

let expiredToken = '';
const testPayload = { email: 'someone@gmail.com', username: 'someone', id: 4003 }

describe("User Utilities & Functions Tests: ", () => {
    test("Should create user into db given valid details", async () => {
      const user = await createUser({ ...testUser, password: await hashPassword(testUser.password) });
      expect(user?.email).toBe(testUser.email)
    });


  test("Should verify user password correctly", async () => {
    const hashedPassword = await hashPassword(testUser.password);
    expect(verifyPassword(testUser.password, hashedPassword))
  });

  test("Should reject invalid User password", async () => {
    const hashedPassword = await hashPassword(testUser.password);
    const verified = await verifyPassword(testUser.password + "roeoe", hashedPassword);
    expect(verified).toBeFalsy();
  })

  test("Should create and verify user acess token",() => {
    const token = createToken(testPayload, 1);
    expect(token.split(".").length).toBe(3);

    const payload = verifyToken(token);
    expect(payload.username).toBe(testUser.username);
  });

  test("Should reject invalid tokens: ", () => {
    const token = createToken(testPayload, 1000 * 60 * 15);
    expiredToken = token;
    expect(token.split(".").length).toBe(3);
    expect(() => verifyToken(token.slice(0, 18))).toThrow('jwt malformed');
  });

  // test("Should reject expire token", async() => {
  //   const token = createToken(testPayload, 1);
  //   expect(token.split(".").length).toBe(3);
  //   expect(() => verifyToken(expiredToken)).toThrow('Expired Token')
  // });
})

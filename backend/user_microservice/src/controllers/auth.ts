import type { Request, Response } from 'express';
import { confirmPasswordReset as updatePassword, getUserWithDetail, createUser, viewUserProfile } from '#repositories/users';
import { createToken, verifyToken,verifyPassword } from '#utils/crypto';
import { upload } from '#utils/uploader';
import type { PasswordResetConfirmInput, SignupData } from '#schemas/auth';



export async function signup(request: Request, response: Response): Promise<void> {
  try {
    if (!request.file) {
      response.status(400).json({ error: 'Avatar image is required' });
      return;
    }
    const avatarUrl = await upload(request.file);
    console.log("URL: ", avatarUrl)
    const user = await createUser({ ...(request.body as SignupData), avatarUrl });

    if (!user) {
      response.status(409).json({ error: 'Email or username is already registered' });
      return;
    }

    response.status(201).json({
      user: toAuthUser(user),
      token: createToken({ sub: String(user.id), email: user.email, username: user.username, pLevel: user.playerLevel },
        60 * 60 * 24)
    });
  } catch (err: unknown) {
    response.status(500).json({
      error: `Internal server error: ${(err as Error).message}`
    })
  }

}

export async function signin(request: Request, response: Response): Promise<void> {
  try {
    const { email, password } = request.body; 
    const user = await getUserWithDetail(email);
    if (!user) {
      response.status(404).json({ error: 'Invalid email or password' });
      return;
    }
    // is password valid
    const isvalid = await verifyPassword(password, user.password);
    if (!isvalid) {
      response.status(404).json({
        error: 'Invalid email or password'
      });
      return
    }
    response.status(200).json({
      user: toAuthUser(user),
      token: createToken({
        sub: String(user.id), email: user.email, username: user.username, pLevel: user.playerLevel
      }, 60 * 60 * 24),
    });
  } catch (err) {
    response.status(500).json({
      error: `Internal server error: ${(err as Error).message}`
    })
  };

}

function toAuthUser(user: {
  id: number;
  email: string;
  username: string;
  accuracy: number;
  wins: number;
  rank: string;
  playerLevel: string;
  bio: string;
  totalScore: number;
  createdAt: Date;
}) {
  return {
    id: String(user.id),
    email: user.email,
    username: user.username,
    p_level: user.playerLevel,
    accuracy: user.accuracy,
    rank: user.rank,
    wins: user.wins,
    bio: user.bio,
    total_score: user.totalScore,
    createdAt: user.createdAt,
  };
}

export async function requestPasswordReset(request: Request, response: Response): Promise<void> {
  // verify user exist in db , then generate reset link link and send to user Email
  const user = await getUserWithDetail(request.body.email);
  if (!user) {
    // for security reasons, user is not getting to know whether email is valid or not 
    response.status(400).json({ message: 'If the account exists, a reset token has been generated'});
    return;
  }
 // INFO: have a way of sending details to client's email 
  const token = createToken({ sub: String(user.id), purpose: 'password-reset' }, 15 * 60);
  response.status(200).json({
    message: 'If the account exists, a reset token has been generated',
    resetToken: token,
  });
}

export async function confirmPasswordReset(request: Request, response: Response): Promise<void> {
  const { token, password } = request.body as PasswordResetConfirmInput;
  try {
    const claims = verifyToken(token);
    if (claims.purpose !== 'password-reset') throw new Error('Invalid reset token');
    const user = await updatePassword(Number(claims.sub), password);
    if (!user) {
      response.status(400).json({ error: 'Invalid reset token' });
      return;
    }
    response.json({ message: 'Password reset successfully' });
  } catch {
    response.status(400).json({ error: 'Invalid or expired reset token' });
  }
}

export async function profile(request: Request, response: Response): Promise<void> {
  const user = await viewUserProfile(request.authUser!.id);
  if (!user) {
    response.status(404).json({ error: 'User not found' });
    return;
  }
  response.json({ user: user });
}

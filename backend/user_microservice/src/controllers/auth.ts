import type { Request, Response } from 'express';
import { updatePassword, getUserWithDetail, createUser, viewUserProfile } from '#repositories/users';
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
    const user = await createUser({ ...(request.body as SignupData), avatarUrl });
    if (!user) {
      response.status(409).json({ error: 'Email or username is already registered' });
      return;
    }
    const { password, ...safeUser } = user; 
   
    response.status(201).json({
      user:safeUser,
      token: createToken({ id: safeUser.id, email: safeUser.email, username: safeUser.username, purpose: 'authentication' })
    });
  } catch (err: unknown) {
    response.status(500).json({
      error: `Internal server error: ${(err as Error).message}`
    })
  }

}

export async function signin(req: Request, res: Response): Promise<void> {
  try {
    const user = await getUserWithDetail(req.body.email);
    if (!user) {
      res.status(404).json({ error: 'Invalid email or password' });
      return;
    }
    const { password, ...safeUser } = user; 
    // is password valid
    const isvalid = await verifyPassword(req.body.password, password);
    if (!isvalid) {
      res.status(404).json({
        error: 'Invalid email or password'
      });
      return
    }
    res.status(200).json({
      user: safeUser ,
      token: createToken({
        id: safeUser.id, email: safeUser.email, username: safeUser.username, purpose: "authentication"
      }),
    });
  } catch (err) {
    res.status(500).json({
      error: `Internal server error: ${(err as Error).message}`
    })
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
  const { id, email, username } = user; 
 // INFO: send token with a link to user's inbox next  
  const token = createToken({id, email,username, purpose:"password-reset"}, 15*60);
  response.status(200).json({
    link: 'https://domain.com/user-id/reset-link',
    message:'Reset password using this link. Link expires in 15 minutes.',
    resetToken: token,
  });
}

export async function confirmPasswordReset(request: Request, response: Response): Promise<void> {
  const { token, password } = request.body as PasswordResetConfirmInput;
  try {
    const claims = verifyToken(token);
    if (claims.purpose !== 'password-reset') throw new Error('Invalid  token');
    const user = await updatePassword(claims.id, password);
    if (!user) {
      response.status(400).json({ error: 'Invalid reset token' });
      return;
    }
    response.json({ message: 'Password reset successfully, you can login now' });
  } catch(err) {
    response.status(500).json({ error: err?.message?? "unknown error" });
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

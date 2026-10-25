import type { Request, Response } from 'express';
import { listUsers, updateUser, viewUserProfile } from '#repositories/users';



export async function getUserDetails(request: Request, response: Response): Promise<void> {
  console.log("HIT")
  const { id } = request.params;
  console.log("ID", id)
  const user = await viewUserProfile(id);
  if (!user) {
    response.status(404).json({ error: 'User not found' });
    return;
  }
  console.log("USER: ", user)
  const { password, ...refineUsr } = user;
  response.json(refineUsr);
};

export async function updateUserProfile(request: Request, response: Response): Promise<void> {   
  const user = await updateUser(request.authUser!.id, request.body);
  if (!user) {
    response.status(404).json({ error: 'User not found' });
    return;
  }
  
  const { password, ...refineUsr } = user;
  response.json(refineUsr);
};


export async function userStats(request: Request, response: Response): Promise<void> {
  const user = await viewUserProfile(request.authUser!.id);
  if (!user) {
    response.status(404).json({ error: 'User not found' });
    return;
  }
  const { password, ...refinedUser } = user;
  response.json(refinedUser);
};

export async function statsById(request: Request, response: Response): Promise<void> {
  const user = await viewUserProfile(Number(request.params.id));
  if (!user) {
    response.status(404).json({ error: 'User not found' });
    return;
  }
  const { password, ...refinedUser } = user;
  response.json(refinedUser);
};


export async function leaderboard(request: Request, response: Response): Promise<void> {
  const page = Math.max(Number(request.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(request.query.limit) || 20, 1), 100);
  const users = await listUsers(limit, (page - 1) * limit);
  // clean user of sensitive password field before sending to client.
  const refinedUsers = users.map((usr) => {
    const { password, ...refineUsr } = usr;
    return refineUsr;
  });

  response.json({ data: refinedUsers, pagination: { page, limit } });
};

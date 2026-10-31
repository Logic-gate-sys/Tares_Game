import type { Request, Response } from 'express';
import { updateUser, viewUserProfile } from '#repositories/users';
import type{ UpdateUserInput } from '#schemas/auth';


export async function getUserDetails(request: Request, response: Response): Promise<void> {
  try {
    const { id } = request.params;
    console.log("ID: ", id)
    const user = await viewUserProfile(Number(id));
    if (!user) {
      response.status(404).json({ error: 'User not found' });
      return;
    };
    const { password,...refineUsr } = user;
    response.json(refineUsr);
  } catch (err) {
    response.status(500).json({ error: err });
  }

};

export async function updateUserProfile(request: Request, response: Response): Promise<void> {
  try {
    const { id } = request.authUser;
    const {...data} = request.body as UpdateUserInput;  
    const user = await updateUser(id, data);
    if (!user) {
      response.status(404).json({ error: 'User not found' });
      return;
    }
    
    const { password, ...refineUsr } = user;
    response.status(200).json(refineUsr);
  } catch (err) {
    response.status(500).json({
      error: err
    })
  }
};


export async function userStats(request: Request, response: Response): Promise<void> {
  try {
    const user = await viewUserProfile(request.authUser!.id);
    if (!user) {
      response.status(404).json({ error: 'User not found' });
      return;
    }
    const { password, ...refinedUser } = user;
    response.json(refinedUser);
  } catch (err) {
    response.status(500).json({ error: err });
  }

};

export async function statsById(request: Request, response: Response): Promise<void> {
  try {
    const user = await viewUserProfile(Number(request.params.id));
    if (!user) {
      response.status(404).json({ error: 'User not found' });
      return;
    }
    const { password, ...refinedUser } = user;
    response.json(refinedUser);
  } catch (err) {
    response.status(500).json({ error: err })
  }
};



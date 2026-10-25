import { desc, eq, or } from 'drizzle-orm';
import { db } from '#config/database';
import { Users } from '#db/schema';
import type { SignupData } from '#schemas/auth';
import { hashPassword } from '#utils/crypto';
import type { UpdateUserInput } from '#schemas/auth'



export type StoredUser = typeof Users.$inferSelect;

export async function createUser(data: SignupData): Promise<StoredUser | undefined> {
  const existing = await db
    .select({ id: Users.id })
    .from(Users)
    .where(or(eq(Users.email, data.email), eq(Users.username, data.username)))
    .limit(1);

  if (existing.length > 0) {
    return undefined;
  }

  const [user] = await db
    .insert(Users)
    .values({
      email: data.email,
      username: data.username,
      password: await hashPassword(data.password),
      playerLevel: data.playerLevel ?? '1',
      rank: data.rank ?? 'unranked',
      bio: data.bio ?? '',
      totalScore: 0,
      wins: 0,
      accuracy: 0,
      avatarUrl: data.avatarUrl,
      bgClass: data.bgClass ?? '',
    })
    .returning();

  return user;
}

export async function getUserWithDetail(email: string): Promise<StoredUser|undefined> {
  const [user] = await db
    .select()
    .from(Users)
    .where(eq(Users.email, email))
    .limit(1);
  // if user is invalid returns undefined
  if (!user ) {
    return undefined;
  }
  return  user;
}


export async function updateUser(userId: number,data: UpdateUserInput): Promise<StoredUser|undefined> {
  const [user] = await db.update(Users)
    .set(data)
    .where(eq(Users.id, userId))
    .returning();
  
  return user;
}

// List all available users for leaderboard. Paged with limit and offset 
export async function listUsers(limit: number, offset: number): Promise<StoredUser[]> {
  return db.select().from(Users)
    .orderBy(desc(Users.totalScore))
    .limit(limit)
    .offset(offset);
}


// Updates user's password in the database 
export async function updatePassword(userId: number, password: string): Promise<StoredUser | undefined> {
  const [user] = await db
    .update(Users)
    .set({ password: await hashPassword(password) })
    .where(eq(Users.id, userId))
    .returning();

  return user;
}

 
export async function viewUserProfile(userId: number): Promise<StoredUser | undefined> {
  const [user] = await db
    .select()
    .from(Users)
    .where(eq(Users.id, userId))
    .limit(1);

  return user;
}

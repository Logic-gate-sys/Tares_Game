import { config } from 'dotenv';
import path from 'node:path';
import { z } from 'zod';
import { existsSync } from 'node:fs';


const nodeEnv = process.env.NODE_ENV ?? 'development';
const envFile = nodeEnv === 'development'? '.env':'.env.test'
const envPath = path.resolve(process.cwd(), envFile);
// Local runs load the file. In Docker it won't exist, and Compose has already set the variables.
if (existsSync(envPath)) {
  const loaded = config({ path: envPath, quiet: true });
  if (loaded.error) {
    console.error(loaded.error);
    process.exit(1);
  }
}
// environment viriable schema
const envSchema = z.object({
  SERVER_PORT: z.coerce.number(),
  DATABASE_URL: z.string().refine((url) =>url.startsWith('postgresql://')),
  AUTH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().describe("JWT Token expiration setting").default('7d'),
  CLOUDINARY_URL: z.string().refine((url) => url.startsWith('cloudinary://'), {message:"Invalid URL"}).optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173')
    .transform((val) => val.split(",").map((origin)=> origin.trim()))
});

// export envschema type
export type Env = z.infer<typeof envSchema>;
const results = envSchema.safeParse(process.env);
if (!results.success) {
  const errorMsg = results.error?.issues.map((iss) => ({
    path: iss.path.join("."),
    message: iss.message
  }))
  console.error(errorMsg);
  process.exit(1); // error out
}

// export env
export const env = results.data;
export default results.data;

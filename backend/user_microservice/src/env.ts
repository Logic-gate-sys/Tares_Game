import { config } from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

const node_env = process.env.NODE_ENV?? "dev";
const loadedVals =config({ path: path.resolve(process.cwd(), node_env === "dev" ? ".env.dev" : node_env === "prod" ? ".env" : ".env.test")  });
if (loadedVals.error) {
  console.error(loadedVals.error)
  process.exit(1);
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
  process.exit(1)
}

// export env
export const env = results.data;
export default results.data;

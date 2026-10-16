import { config } from 'dotenv';
import { z } from 'zod';

const node_env = process.env.NODE_ENV?? "dev";
const loadedVals = config({ path: node_env === "dev"? ".env.dev" : node_env === "prod" ? ".env" : ".env.test" });


// environment viriable schema
const envSchema = z.object({
  SERVER_PORT: z.coerce.number(),
  DATABASE_URL: z.string().refine((url) =>url.startsWith('postgresql://'), { message: 'Invalid DATABASE_URL' }),
  AUTH_SECRET: z.string().min(32),
  CLOUDINARY_URL: z.string().refine((url) => url.startsWith('cloudinary://'), { message: 'Invalid cloudinary URL' }).optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173')
    .transform((val) => val.split(",").map((origin)=> origin.trim()))
});

// export envschema type
export type Env = z.infer<typeof envSchema>;

const results = envSchema.safeParse(loadedVals.parsed);
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

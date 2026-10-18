import { Router } from 'express';
import {confirmPasswordReset, requestPasswordReset,signin,signup} from '#controllers/auth';
import { validateRequestBody } from '#middlewares/validate';
import { passwordResetConfirmSchema, passwordResetRequestSchema, signinSchema, signupSchema } from '#schemas/auth';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (_request, file, callback) => {
    callback(null, file.mimetype.startsWith('image/'));
  },
});

router.post(['/register', '/signup'],upload.single('avatar'), validateRequestBody(signupSchema), signup);
router.post('/login', validateRequestBody(signinSchema), signin);
router.post('/forgot-password', validateRequestBody(passwordResetRequestSchema), requestPasswordReset);
router.post('/reset-password', validateRequestBody(passwordResetConfirmSchema), confirmPasswordReset);

export default router;

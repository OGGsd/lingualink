import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { authRateLimit } from "../middleware/security.middleware.js";
import {
  validateSignup,
  validateLogin,
  validateProfileUpdate
} from "../middleware/validation.middleware.js";

const router = express.Router();

// Apply auth rate limiting to all auth routes
router.use(authRateLimit);

// Authentication routes
router.post("/signup", validateSignup, signup);
router.post("/login", validateLogin, login);
router.post("/logout", logout);

// Email verification routes
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Profile routes
router.put("/update-profile", protectRoute, validateProfileUpdate, updateProfile);

// Auth check route
router.get("/check", protectRoute, (req, res) => res.status(200).json(req.user));

export default router;

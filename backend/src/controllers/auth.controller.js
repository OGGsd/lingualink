import { sendWelcomeEmail, sendEmailVerification, sendPasswordResetEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";
import { sanitizeInput, sanitizeEmail, validateImageData } from "../utils/security.utils.js";
import { generateSecureToken, createTokenExpiration } from "../utils/crypto.utils.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Sanitize inputs
    const sanitizedFullName = sanitizeInput(fullName);
    const sanitizedEmail = sanitizeEmail(email);

    if (!sanitizedFullName || !sanitizedEmail || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findByEmail(sanitizedEmail);
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      fullName: sanitizedFullName,
      email: sanitizedEmail,
      password: hashedPassword,
    });

    if (newUser) {
      // Generate email verification token
      const verificationToken = generateSecureToken();
      const verificationExpires = createTokenExpiration(24 * 60); // 24 hours

      // Set verification token in database
      await User.setEmailVerificationToken(newUser._id, verificationToken, verificationExpires);

      // Create verification URL
      const verificationUrl = `${ENV.CLIENT_URL}/verify-email?token=${verificationToken}`;

      // Send verification email
      try {
        await sendEmailVerification(newUser.email, newUser.fullName, verificationUrl, verificationToken);
        console.log(`✅ Verification email sent to ${newUser.email}`);
      } catch (error) {
        console.error("Failed to send verification email:", error);
        // Don't fail signup if email fails, but log it
      }

      // Return user data WITHOUT generating auth token (user must verify email first)
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        emailVerified: false,
        message: "Account created successfully! Please check your email to verify your account before signing in."
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  // Sanitize email input
  const sanitizedEmail = sanitizeEmail(email);

  if (!sanitizedEmail || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findByEmail(sanitizedEmail);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    // never tell the client which one is incorrect: password or email

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email address before signing in. Check your inbox for the verification link.",
        emailVerified: false,
        email: user.email
      });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (_, res) => {
  // Clear cookie with same settings as when it was set
  res.cookie("jwt", "", {
    maxAge: 0,
    httpOnly: true,
    sameSite: ENV.ALLOW_DEV_RATE_LIMITS === 'true' ? "none" : "none", // Use none for multi-backend
    secure: true,
    domain: undefined
  });
  res.status(200).json({ message: "Logged out successfully" });
};

/**
 * Verify email with token
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    // Verify email with token
    const user = await User.verifyEmailWithToken(token);

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token. Please request a new verification email."
      });
    }

    // Send welcome email after successful verification
    try {
      await sendWelcomeEmail(user.email, user.fullName, ENV.CLIENT_URL);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      // Don't fail verification if welcome email fails
    }

    res.status(200).json({
      message: "Email verified successfully! You can now sign in to your account.",
      emailVerified: true
    });
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Resend email verification
 */
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const sanitizedEmail = sanitizeEmail(email);

    if (!sanitizedEmail) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const user = await User.findByEmail(sanitizedEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new verification token
    const verificationToken = generateSecureToken();
    const verificationExpires = createTokenExpiration(24 * 60); // 24 hours

    // Update verification token in database
    await User.setEmailVerificationToken(user._id, verificationToken, verificationExpires);

    // Create verification URL
    const verificationUrl = `${ENV.CLIENT_URL}/verify-email?token=${verificationToken}`;

    // Send verification email
    await sendEmailVerification(user.email, user.fullName, verificationUrl, verificationToken);

    res.status(200).json({
      message: "Verification email sent successfully! Please check your inbox."
    });
  } catch (error) {
    console.error("Error in resendVerification:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const sanitizedEmail = sanitizeEmail(email);

    if (!sanitizedEmail) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const user = await User.findByEmail(sanitizedEmail);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        message: "If an account with that email exists, we've sent a password reset link."
      });
    }

    // Generate password reset token
    const resetToken = generateSecureToken();
    const resetExpires = createTokenExpiration(60); // 1 hour

    // Set reset token in database
    await User.setPasswordResetToken(user.email, resetToken, resetExpires);

    // Create reset URL
    const resetUrl = `${ENV.CLIENT_URL}/reset-password?token=${resetToken}`;

    // Send password reset email
    await sendPasswordResetEmail(user.email, user.fullName, resetUrl, resetToken);

    res.status(200).json({
      message: "If an account with that email exists, we've sent a password reset link."
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Reset password with token
    const user = await User.resetPasswordWithToken(token, hashedPassword);

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token. Please request a new password reset."
      });
    }

    res.status(200).json({
      message: "Password reset successfully! You can now sign in with your new password."
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) return res.status(400).json({ message: "Profile pic is required" });

    const userId = req.user._id;

    // Validate image data
    const imageValidation = validateImageData(profilePic);
    if (!imageValidation.valid) {
      return res.status(400).json({ message: imageValidation.error });
    }

    // Store the validated base64 image
    const updatedUser = await User.updateProfilePic(userId, profilePic);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

import { resendClient, sender } from "../lib/resend.js";
import {
  createWelcomeEmailTemplate,
  createEmailVerificationTemplate,
  createPasswordResetTemplate
} from "../emails/emailTemplates.js";

/**
 * Send email verification email
 */
export const sendEmailVerification = async (email, name, verificationUrl, token) => {
  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Verify Your Email - LinguaLink",
    html: createEmailVerificationTemplate(name, verificationUrl, token),
  });

  if (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }

  console.log("✅ Email verification sent successfully", data);
  return data;
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, name, resetUrl, token) => {
  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Reset Your Password - LinguaLink",
    html: createPasswordResetTemplate(name, resetUrl, token),
  });

  if (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }

  console.log("✅ Password reset email sent successfully", data);
  return data;
};

/**
 * Send welcome email (after email verification)
 */
export const sendWelcomeEmail = async (email, name, clientURL) => {
  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Welcome to LinguaLink! 🌐",
    html: createWelcomeEmailTemplate(name, clientURL),
  });

  if (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }

  console.log("✅ Welcome email sent successfully", data);
  return data;
};

/**
 * Create email verification template
 */
export function createEmailVerificationTemplate(name, verificationUrl, token) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - LinguaLink</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: linear-gradient(to right, #36D1DC, #5B86E5); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
      <div style="display: inline-block; width: 80px; height: 80px; background-color: white; border-radius: 50%; margin-bottom: 20px; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px;">
          <div style="width: 32px; height: 24px; border: 3px solid #36D1DC; border-radius: 6px; position: relative; margin: 0 auto;">
            <div style="position: absolute; top: 8px; left: 6px; width: 20px; height: 2px; background-color: #36D1DC; border-radius: 1px;"></div>
            <div style="position: absolute; top: 12px; left: 6px; width: 16px; height: 2px; background-color: #5B86E5; border-radius: 1px;"></div>
            <div style="position: absolute; top: 16px; left: 6px; width: 12px; height: 2px; background-color: #36D1DC; border-radius: 1px;"></div>
          </div>
        </div>
      </div>
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 500;">Verify Your Email</h1>
    </div>
    <div style="background-color: #ffffff; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <p style="font-size: 18px; color: #5B86E5;"><strong>Hello ${name},</strong></p>
      <p>Thank you for signing up for LinguaLink! To complete your registration and start breaking language barriers, please verify your email address.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(to right, #36D1DC, #5B86E5); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(54, 209, 220, 0.3);">
          Verify Email Address
        </a>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #36D1DC;">
        <p style="margin: 0; font-size: 14px; color: #666;">
          <strong>Security Note:</strong> This verification link will expire in 24 hours for your security.
        </p>
      </div>

      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        If you didn't create an account with LinguaLink, please ignore this email.
      </p>

      <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
        <p style="font-size: 12px; color: #999; margin: 0;">
          © 2024 LinguaLink Technologies. All rights reserved.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Create password reset template
 */
export function createPasswordResetTemplate(name, resetUrl, token) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - LinguaLink</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: linear-gradient(to right, #FF6B6B, #FF8E53); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
      <div style="display: inline-block; width: 80px; height: 80px; background-color: white; border-radius: 50%; margin-bottom: 20px; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px;">
          <div style="width: 24px; height: 24px; border: 3px solid #FF6B6B; border-radius: 50%; position: relative; margin: 0 auto;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: #FF8E53; border-radius: 50%;"></div>
          </div>
        </div>
      </div>
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 500;">Reset Your Password</h1>
    </div>
    <div style="background-color: #ffffff; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <p style="font-size: 18px; color: #FF6B6B;"><strong>Hello ${name},</strong></p>
      <p>We received a request to reset your password for your LinguaLink account. Click the button below to create a new password.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(to right, #FF6B6B, #FF8E53); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">
          Reset Password
        </a>
      </div>

      <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
        <p style="margin: 0; font-size: 14px; color: #856404;">
          <strong>Security Alert:</strong> This reset link will expire in 1 hour. If you didn't request this reset, please ignore this email.
        </p>
      </div>

      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        For your security, this link can only be used once and will expire soon.
      </p>

      <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
        <p style="font-size: 12px; color: #999; margin: 0;">
          © 2024 LinguaLink Technologies. All rights reserved.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Create welcome email template (sent after email verification)
 */
export function createWelcomeEmailTemplate(name, clientURL) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Lingua Link</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: linear-gradient(to right, #36D1DC, #5B86E5); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
      <img src="https://lingualink.tech/favicon-96x96.png" alt="Lingua Link Logo" style="width: 80px; height: 80px; margin-bottom: 20px; border-radius: 50%; background-color: white; padding: 10px;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 500;">Welcome to Lingua Link!</h1>
    </div>
    <div style="background-color: #ffffff; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <p style="font-size: 18px; color: #5B86E5;"><strong>Hello ${name},</strong></p>
      <p>We're excited to have you join our messaging platform! Lingua Link connects you with friends, family, and colleagues in real-time, no matter where they are.</p>
      
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #36D1DC;">
        <p style="font-size: 16px; margin: 0 0 15px 0;"><strong>Get started in just a few steps:</strong></p>
        <ul style="padding-left: 20px; margin: 0;">
          <li style="margin-bottom: 10px;">Set up your profile picture</li>
          <li style="margin-bottom: 10px;">Find and add your contacts</li>
          <li style="margin-bottom: 10px;">Start a conversation</li>
          <li style="margin-bottom: 0;">Share photos, videos, and more</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href=${clientURL} style="background: linear-gradient(to right, #36D1DC, #5B86E5); color: white; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: 500; display: inline-block;">Open Lingua Link</a>
      </div>
      
      <p style="margin-bottom: 5px;">If you need any help or have questions, we're always here to assist you.</p>
      <p style="margin-top: 0;">Happy messaging!</p>
      
      <p style="margin-top: 25px; margin-bottom: 0;">Best regards,<br>The Lingua Link Team</p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
      <p>© 2025 Lingua Link. All rights reserved.</p>
      <p>
        <a href="#" style="color: #5B86E5; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
        <a href="#" style="color: #5B86E5; text-decoration: none; margin: 0 10px;">Terms of Service</a>
        <a href="#" style="color: #5B86E5; text-decoration: none; margin: 0 10px;">Contact Us</a>
      </p>
    </div>
  </body>
  </html>
  `;
}

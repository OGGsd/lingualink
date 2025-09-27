/**
 * Email Service with Resend Integration
 * Handles email sending with modern HTML/CSS templates
 */

import { Resend } from 'resend';

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = 'support@lingualink.tech';
    this.fromName = 'LinguaLink Support';
  }

  /**
   * Modern email template with responsive design
   */
  createEmailTemplate(content, subject, preheader = '') {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${subject}</title>
    <style>
        /* Reset styles */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        /* Base styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
        }
        
        /* Container */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        /* Header */
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
            text-decoration: none;
            display: inline-block;
            margin-bottom: 10px;
        }
        
        .tagline {
            color: #e2e8f0;
            font-size: 16px;
            margin: 0;
        }
        
        /* Content */
        .email-content {
            padding: 40px 30px;
        }
        
        .content-section {
            margin-bottom: 30px;
        }
        
        .content-section:last-child {
            margin-bottom: 0;
        }
        
        h1, h2, h3 {
            color: #1a202c;
            margin-bottom: 16px;
        }
        
        h1 { font-size: 24px; font-weight: 700; }
        h2 { font-size: 20px; font-weight: 600; }
        h3 { font-size: 18px; font-weight: 600; }
        
        p {
            margin-bottom: 16px;
            color: #4a5568;
            font-size: 16px;
        }
        
        /* Buttons */
        .btn {
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
            background: #e2e8f0;
            color: #4a5568 !important;
        }
        
        .btn-secondary:hover {
            background: #cbd5e0;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* Cards */
        .card {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin: 20px 0;
        }
        
        .card-highlight {
            background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
            border-color: #667eea;
        }
        
        /* Lists */
        ul, ol {
            margin: 16px 0;
            padding-left: 24px;
        }
        
        li {
            margin-bottom: 8px;
            color: #4a5568;
        }
        
        /* Footer */
        .email-footer {
            background: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #718096;
            font-size: 14px;
            margin-bottom: 16px;
        }
        
        .social-links {
            margin: 20px 0;
        }
        
        .social-link {
            display: inline-block;
            margin: 0 10px;
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
        }
        
        .unsubscribe {
            color: #a0aec0;
            font-size: 12px;
            text-decoration: none;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .email-header,
            .email-content,
            .email-footer {
                padding: 20px;
            }
            
            .btn {
                display: block;
                width: 100%;
                text-align: center;
            }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .email-container {
                background-color: #1a202c;
            }
            
            .email-content {
                color: #e2e8f0;
            }
            
            h1, h2, h3 {
                color: #f7fafc;
            }
            
            p {
                color: #cbd5e0;
            }
            
            .card {
                background: #2d3748;
                border-color: #4a5568;
            }
            
            .email-footer {
                background: #2d3748;
                border-color: #4a5568;
            }
        }
    </style>
</head>
<body>
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        ${preheader}
    </div>
    
    <div class="email-container">
        <div class="email-header">
            <a href="https://lingualink.tech" class="logo">🌐 LinguaLink</a>
            <p class="tagline">Breaking Language Barriers with AI</p>
        </div>
        
        <div class="email-content">
            ${content}
        </div>
        
        <div class="email-footer">
            <p class="footer-text">
                Thank you for using LinguaLink!<br>
                We're here to help you communicate across languages.
            </p>
            
            <div class="social-links">
                <a href="https://lingualink.tech" class="social-link">Website</a>
                <a href="mailto:support@lingualink.tech" class="social-link">Support</a>
                <a href="https://lingualink.tech/privacy" class="social-link">Privacy</a>
            </div>
            
            <p>
                <a href="#" class="unsubscribe">Unsubscribe</a> | 
                <a href="mailto:support@lingualink.tech" class="unsubscribe">Contact Support</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Send email using Resend
   */
  async sendEmail({ from, to, subject, content, preheader = '' }) {
    try {
      const htmlContent = this.createEmailTemplate(content, subject, preheader);

      // Use custom from address if provided, otherwise use default
      const fromAddress = from || this.fromEmail;
      const fromName = from ? 'LinguaLink Admin' : this.fromName;

      const result = await this.resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: htmlContent,
      });

      console.log('✅ Email sent successfully:', result);
      return {
        success: true,
        messageId: result.data?.id,
        result
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(userEmail, userName) {
    const content = `
      <div class="content-section">
        <h1>Welcome to LinguaLink! 🎉</h1>
        <p>Hi ${userName || 'there'},</p>
        <p>Welcome to LinguaLink, your AI-powered translation companion! We're excited to help you break down language barriers and communicate seamlessly across the globe.</p>
      </div>
      
      <div class="card card-highlight">
        <h3>🚀 Get Started</h3>
        <p>Here's what you can do with LinguaLink:</p>
        <ul>
          <li><strong>Real-time Translation:</strong> Translate messages instantly</li>
          <li><strong>Multiple Languages:</strong> Support for 100+ languages</li>
          <li><strong>Smart Context:</strong> AI understands context for better translations</li>
          <li><strong>Secure & Private:</strong> Your conversations stay private</li>
        </ul>
      </div>
      
      <div class="content-section" style="text-align: center;">
        <a href="https://lingualink.tech/dashboard" class="btn">Start Translating</a>
      </div>
      
      <div class="content-section">
        <p>If you have any questions, feel free to reach out to our support team at <a href="mailto:support@lingualink.tech">support@lingualink.tech</a>.</p>
        <p>Happy translating!</p>
        <p><strong>The LinguaLink Team</strong></p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to LinguaLink! 🌐',
      content,
      preheader: 'Start breaking language barriers with AI-powered translations'
    });
  }

  /**
   * Send admin notification email
   */
  async sendAdminNotification(adminEmail, title, message, data = {}) {
    const content = `
      <div class="content-section">
        <h1>🔔 Admin Notification</h1>
        <h2>${title}</h2>
        <p>${message}</p>
      </div>
      
      ${Object.keys(data).length > 0 ? `
      <div class="card">
        <h3>📊 Details</h3>
        ${Object.entries(data).map(([key, value]) => `
          <p><strong>${key}:</strong> ${value}</p>
        `).join('')}
      </div>
      ` : ''}
      
      <div class="content-section" style="text-align: center;">
        <a href="https://lingualink.tech/admin" class="btn">View Admin Dashboard</a>
      </div>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `LinguaLink Admin: ${title}`,
      content,
      preheader: message
    });
  }
}

export default new EmailService();

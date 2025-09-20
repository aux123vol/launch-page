import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, signupCount: number): Promise<boolean> {
  return sendEmail({
    to: email,
    from: 'noreply@genre.ai', // Replace with your verified sender email
    subject: 'Welcome to the Genre Mission! 🚀',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Welcome to the Genre Mission!</h1>
        
        <p>Thank you for joining our mission to revolutionize storytelling with AI!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">You're Creator #${signupCount}!</h3>
          <p>You've joined an exclusive community of forward-thinking creators who believe in the future of AI-assisted storytelling.</p>
        </div>
        
        <h3>What's Next?</h3>
        <ul>
          <li>🔔 We'll keep you updated on our progress</li>
          <li>📖 Early access to Genre features as they launch</li>
          <li>💡 Exclusive tips and insights on AI storytelling</li>
          <li>🎯 First in line for special opportunities</li>
        </ul>
        
        <p>Stay tuned for more exciting updates!</p>
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          The Genre Team
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          You're receiving this because you signed up for updates from Genre. 
          If you have any questions, reply to this email.
        </p>
      </div>
    `,
    text: `Welcome to the Genre Mission!
    
Thank you for joining our mission to revolutionize storytelling with AI!

You're Creator #${signupCount}! You've joined an exclusive community of forward-thinking creators who believe in the future of AI-assisted storytelling.

What's Next?
- We'll keep you updated on our progress
- Early access to Genre features as they launch
- Exclusive tips and insights on AI storytelling
- First in line for special opportunities

Stay tuned for more exciting updates!

Best regards,
The Genre Team`
  });
}
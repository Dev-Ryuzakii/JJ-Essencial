import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { AdminOnly } from '../../common/decorators/admin.decorator';

class TestEmailDto {
  email: string;
  subject?: string;
  message?: string;
}

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('test')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test email sending functionality (Admin only)' })
  @ApiResponse({ status: 200, description: 'Test email sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async testEmail(@Body() testEmailDto: TestEmailDto) {
    const { email, subject = 'Test Email', message = 'This is a test email from your e-commerce backend!' } = testEmailDto;

    try {
      await this.emailService.sendEmail({
        to: email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4CAF50;">🎉 Email Test Successful!</h2>
            <p>Congratulations! Your email service is working correctly.</p>
            <p><strong>Message:</strong> ${message}</p>
            <p>This test email was sent from your JJ-Essential e-commerce backend.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Sent at: ${new Date().toLocaleString()}<br>
              From: JJ-Essential Email Service
            </p>
          </div>
        `,
        text: `Email Test Successful! ${message} - Sent at: ${new Date().toLocaleString()}`
      });

      return {
        success: true,
        message: 'Test email sent successfully',
        recipient: email,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send test email',
        error: error.message,
        recipient: email
      };
    }
  }

  @Post('test-welcome')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test welcome email template (Admin only)' })
  async testWelcomeEmail(@Body() testEmailDto: { email: string; name?: string }) {
    const { email, name = 'Test User' } = testEmailDto;

    try {
      await this.emailService.sendWelcomeEmail(email, name);
      
      return {
        success: true,
        message: 'Welcome email sent successfully',
        recipient: email,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send welcome email',
        error: error.message,
        recipient: email
      };
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Check email service health' })
  @ApiResponse({ status: 200, description: 'Email service status' })
  async getEmailHealth() {
    // Check if email configuration is available
    const hasSmtpHost = !!process.env.SMTP_HOST;
    const hasSmtpUser = !!process.env.SMTP_USER;
    const hasSmtpPass = !!process.env.SMTP_PASS;
    const hasFromEmail = !!process.env.FROM_EMAIL;

    const isConfigured = hasSmtpHost && hasSmtpUser && hasSmtpPass && hasFromEmail;

    return {
      status: isConfigured ? 'configured' : 'not_configured',
      configuration: {
        smtp_host: hasSmtpHost ? 'configured' : 'missing',
        smtp_user: hasSmtpUser ? 'configured' : 'missing',
        smtp_pass: hasSmtpPass ? 'configured' : 'missing',
        from_email: hasFromEmail ? 'configured' : 'missing',
      },
      message: isConfigured 
        ? 'Email service is properly configured' 
        : 'Email service requires configuration. Please check your .env file.',
      lastChecked: new Date().toISOString()
    };
  }
}
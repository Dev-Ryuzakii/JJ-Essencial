# 📧 Email System Integration Guide

## Overview

The JJ-Essential e-commerce backend now includes a comprehensive email system that automatically sends notifications for various user actions and admin events. This guide explains how the email system works, how to configure it, and how to test it.

## Features Implemented

### ✅ Email Templates
- **Welcome Email**: Sent when users sign up
- **Order Confirmation**: Sent when orders are created
- **Payment Success**: Sent when payments are completed
- **Password Reset**: Sent for password reset requests
- **Admin Order Notifications**: Sent to admins when new orders are placed
- **Bank Transfer Instructions**: Sent for manual payment methods
- **Receipt Upload Notifications**: Sent when payment receipts are uploaded
- **Payment Rejection Emails**: Sent when payments are rejected

### ✅ Integration Points
- **Authentication Service**: Welcome emails on signup, password reset emails
- **Orders Service**: Order confirmation emails for customers, admin notifications
- **Payments Service**: Payment success/failure notifications, bank transfer instructions
- **Admin Notifications**: Real-time notifications for new orders

## Configuration

### 1. Environment Variables

Copy `.env.example` to `.env` and configure the following:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

FROM_EMAIL=noreply@yourstore.com
FROM_NAME=Your E-commerce Store
ADMIN_EMAIL=admin@yourstore.com

# Frontend URL for password reset links
FRONTEND_URL=http://localhost:3000
```

### 2. Gmail Setup Instructions

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Gmail Settings → Security
   - Select "App passwords" under "2-Step Verification"
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

### 3. Other Email Providers

- **Outlook**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Use your provider's settings

## API Endpoints

### Email Health Check
```
GET /api/v1/email/health
```
Returns the configuration status of the email service.

### Test Email (Admin Only)
```
POST /api/v1/email/test
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "test@example.com",
  "subject": "Test Email",
  "message": "This is a test message"
}
```

### Test Welcome Email (Admin Only)
```
POST /api/v1/email/test-welcome
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "test@example.com",
  "name": "Test User"
}
```

## Email Triggers

### Automatic Email Sending

1. **User Registration**
   ```typescript
   // When a user signs up
   await authService.signUp(signUpDto);
   // → Automatically sends welcome email
   ```

2. **Order Creation**
   ```typescript
   // When an order is created
   await ordersService.create(userId, createOrderDto);
   // → Sends order confirmation to customer
   // → Sends admin notification email
   ```

3. **Payment Success**
   ```typescript
   // When payment is successful
   await paymentsService.confirmPayment(paymentData);
   // → Sends payment success email to customer
   ```

4. **Password Reset**
   ```typescript
   // When password reset is requested
   await authService.resetPassword({ email });
   // → Sends password reset email with secure link
   ```

## Email Templates

### Template Customization

All email templates are located in `src/modules/email/email.service.ts`. Each template method can be customized:

- `getWelcomeEmailTemplate()`
- `getOrderConfirmationTemplate()`
- `getPaymentSuccessTemplate()`
- `getPasswordResetTemplate()`
- `getAdminOrderNotificationTemplate()`
- `getBankTransferInstructionsTemplate()`
- `getReceiptUploadNotificationTemplate()`
- `getPaymentRejectionTemplate()`

### Example Template Structure
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Title</title>
    <style>
        /* Responsive CSS styles */
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Header</h1>
        </div>
        <div class="content">
            <!-- Email content -->
        </div>
    </div>
</body>
</html>
```

## Testing the Email System

### 1. Check Configuration
```bash
curl http://localhost:3000/api/v1/email/health
```

### 2. Test Basic Email Sending
```bash
# First, get admin token
curl -X POST http://localhost:3000/api/v1/auth/admin/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"your_admin_email","password":"your_admin_password"}'

# Then test email
curl -X POST http://localhost:3000/api/v1/email/test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","subject":"Test Email"}'
```

### 3. Test User Flow
```bash
# Test user registration (triggers welcome email)
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","fullName":"Test User"}'
```

## Error Handling

The email system includes robust error handling:

- **Non-blocking**: Email failures don't break user flows
- **Logging**: All email attempts are logged
- **Graceful degradation**: Services continue working even if email fails

### Example Error Handling
```typescript
try {
  await this.emailService.sendWelcomeEmail(email, name);
  this.logger.log(`Welcome email sent to ${email}`);
} catch (emailError) {
  this.logger.warn(`Failed to send welcome email to ${email}:`, emailError.message);
  // Continue with user registration - don't fail the process
}
```

## Production Considerations

### 1. Email Queue System
For high-volume production environments, consider implementing an email queue:
- Use Redis + Bull for job queues
- Rate limiting for email sending
- Retry mechanisms for failed emails

### 2. Email Analytics
Track email performance:
- Delivery rates
- Open rates
- Click-through rates
- Bounce rates

### 3. Email Templates Management
- Store templates in database for easy editing
- Version control for template changes
- A/B testing for email effectiveness

### 4. Security
- Use secure SMTP connections (TLS/SSL)
- Implement email rate limiting
- Validate email addresses before sending
- Use email authentication (SPF, DKIM, DMARC)

## Troubleshooting

### Common Issues

1. **SMTP Authentication Failed**
   - Check SMTP credentials
   - Ensure app password is used (not regular password)
   - Verify SMTP host and port

2. **Emails Not Sending**
   - Check email health endpoint
   - Verify environment variables
   - Check application logs

3. **Emails Going to Spam**
   - Configure SPF records
   - Use authenticated domain
   - Include unsubscribe links

### Debug Steps

1. **Check Configuration**
   ```bash
   curl http://localhost:3000/api/v1/email/health
   ```

2. **Test SMTP Connection**
   ```typescript
   // Use email test endpoint to verify SMTP works
   ```

3. **Check Logs**
   ```bash
   # Look for email-related logs in console output
   ```

## Integration Examples

### Frontend Integration

```typescript
// React component example
const handleSignup = async (formData) => {
  try {
    const response = await fetch('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      // User registered successfully
      // Welcome email automatically sent
      showSuccess('Registration successful! Check your email for welcome message.');
    }
  } catch (error) {
    showError('Registration failed');
  }
};
```

### Custom Email Integration

```typescript
// Add new email type
async sendCustomEmail(userEmail: string, customData: any): Promise<void> {
  const emailTemplate: EmailTemplate = {
    to: userEmail,
    subject: 'Custom Notification',
    html: this.getCustomEmailTemplate(customData),
    text: 'Custom notification text'
  };

  await this.sendEmail(emailTemplate);
}

private getCustomEmailTemplate(data: any): string {
  return `
    <div>
      <h2>Custom Notification</h2>
      <p>Custom content: ${data.message}</p>
    </div>
  `;
}
```

## Summary

The email system is now fully integrated and provides:

✅ **Automated welcome emails** on user registration  
✅ **Order confirmation emails** for customers  
✅ **Admin notifications** for new orders  
✅ **Payment confirmation emails**  
✅ **Password reset functionality**  
✅ **Bank transfer instructions**  
✅ **Receipt verification notifications**  
✅ **Comprehensive error handling**  
✅ **Test endpoints** for verification  
✅ **Health check endpoint**  
✅ **Professional HTML templates**  

The system is production-ready and can be easily extended with additional email types as needed.
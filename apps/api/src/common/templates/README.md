# Email Templates

Professional, responsive email templates for Time2Ship transactional emails.

## Features

- **Responsive Design**: Works on all devices and screen sizes
- **Email Client Compatible**: Tested with Gmail, Outlook, Apple Mail, and more
- **Professional Styling**: Modern, clean design with consistent branding
- **Accessible**: Semantic HTML and proper alt text
- **Easy to Customize**: Modular components for quick modifications

## Available Templates

### 1. Welcome Email
Sent when a user successfully registers for an account.

```typescript
emailService.sendWelcomeEmail('user@example.com', {
  email: 'user@example.com'
});
```

**Features:**
- Welcoming message with emoji
- User account details
- Getting started checklist
- Call-to-action button to dashboard
- Support information

### 2. Password Reset Email
Sent when a user requests a password reset.

```typescript
emailService.sendPasswordResetEmail('user@example.com', {
  email: 'user@example.com',
  resetToken: 'secure-token-here'
});
```

**Features:**
- Clear reset button with secure link
- Expiration notice (1 hour)
- Security warning if not requested
- Alternative plain text link
- Professional security notice

### 3. Email Verification Email
Sent when a user needs to verify their email address.

```typescript
emailService.sendVerificationEmail('user@example.com', {
  email: 'user@example.com',
  verificationToken: 'verification-token-here'
});
```

**Features:**
- Verification button with secure link
- Expiration notice (24 hours)
- Explanation of why verification is needed
- Alternative plain text link
- Ignore notice for unsolicited emails

## Template Components

The email templates use a modular component system from [email-layout.ts](./email-layout.ts):

### `createEmailLayout(options)`
Base layout wrapper for all emails.

```typescript
createEmailLayout({
  title: 'Email Title',
  preheader: 'Preview text shown in inbox',
  content: 'HTML content here',
  brandName: 'Time2Ship',
  logoUrl: 'https://example.com/logo.png' // optional
});
```

### `emailHeading(text, options?)`
Styled H1 heading.

```typescript
emailHeading('Welcome to Time2Ship! 🚀')
```

### `emailParagraph(text)`
Styled paragraph with proper spacing.

```typescript
emailParagraph('This is a paragraph of text.')
```

### `emailButton(text, url, options?)`
Call-to-action button with custom color.

```typescript
emailButton('Get Started', 'https://example.com/dashboard', {
  color: '#3b82f6'
})
```

### `emailInfoBox(content, options?)`
Highlighted information box with optional background color.

```typescript
emailInfoBox(`
  <strong>Important:</strong><br />
  This is important information.
`, { backgroundColor: '#fef2f2' })
```

### `emailCodeBlock(code)`
Monospace code block for tokens or URLs.

```typescript
emailCodeBlock('https://example.com/verify?token=abc123')
```

### `emailSignature(brandName?)`
Consistent sign-off signature.

```typescript
emailSignature('Time2Ship')
```

### `emailDivider()`
Horizontal divider line.

```typescript
emailDivider()
```

## Configuration

Email settings are configured via environment variables in `.env`:

```bash
# Email SMTP Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@time2ship.com
EMAIL_FROM_NAME=Time2Ship

# Client URL for email links
CLIENT_URL=http://localhost:3000
```

## Creating New Email Templates

To create a new email template:

1. **Add a method to EmailService**:

```typescript
async sendNewEmail(to: string, data: { /* your data */ }): Promise<void> {
  const subject = 'Your Subject';
  const html = this.getNewEmailTemplate(data);
  await this.sendEmail(to, subject, html);
}
```

2. **Create the template method**:

```typescript
private getNewEmailTemplate(data: { /* your data */ }): string {
  const content = `
    ${emailHeading('Your Heading')}
    ${emailParagraph('Your content here')}
    ${emailButton('Call to Action', 'https://example.com')}
    ${emailSignature()}
  `;

  return createEmailLayout({
    title: 'Email Title',
    preheader: 'Preview text',
    content,
  });
}
```

3. **Add tests**:

```typescript
it('should send new email with correct data', async () => {
  await emailService.sendNewEmail('test@example.com', { /* data */ });
  expect(true).toBe(true);
});
```

## Best Practices

### Email Client Compatibility
- Uses table-based layout (required for Outlook)
- Inline CSS styles (most email clients strip `<style>` tags)
- Tested with major email clients
- Responsive design with media queries

### Security
- All user data is HTML-escaped
- Links include proper validation
- Tokens are displayed securely
- Clear security warnings where appropriate

### User Experience
- Clear subject lines
- Preheader text for inbox preview
- Mobile-responsive design
- Accessible color contrast
- Clear call-to-action buttons

### Performance
- Fire-and-forget pattern for non-critical emails
- Errors logged but don't block user flows
- Test environment skips actual sending

## Testing

Email templates are tested in [email.service.test.ts](../services/__tests__/email.service.test.ts).

Run tests:
```bash
npm test -- email.service.test.ts
```

## Email Service Behavior

### Development Mode
Without email credentials configured:
- Emails are logged to console
- Preview of email content shown in logs
- No actual emails sent

With email credentials:
- Emails sent via SMTP
- Success logged with message ID

### Production Mode
- Emails sent via SMTP
- Errors logged but don't throw
- Failed emails should be queued for retry (implement as needed)

### Test Mode
- Emails logged only
- No actual sending occurs
- Tests verify template generation

## Future Enhancements

Consider adding:
- [ ] HTML email previews in development
- [ ] Email queue for retry logic
- [ ] Email templates with images/logos
- [ ] A/B testing support
- [ ] Localization/i18n support
- [ ] Email analytics tracking
- [ ] Rich text editor for template customization

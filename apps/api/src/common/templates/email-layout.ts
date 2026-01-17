/**
 * Email template utilities for creating professional, responsive HTML emails.
 * Provides base layout and styling for transactional emails.
 */

interface EmailLayoutOptions {
  title: string;
  preheader?: string;
  content: string;
  brandName?: string;
  brandColor?: string;
  logoUrl?: string;
}

/**
 * Base email layout with responsive design and professional styling.
 * Compatible with major email clients including Gmail, Outlook, Apple Mail.
 */
export function createEmailLayout(options: EmailLayoutOptions): string {
  const {
    title,
    preheader = '',
    content,
    brandName = 'Time2Ship',
    logoUrl,
  } = options;

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${title}</title>
    <!--[if mso]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
      /* Reset styles */
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

      /* Body styles */
      body {
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        background-color: #f4f4f4;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      /* Prevent Gmail from changing link colors */
      a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: none !important;
        font-size: inherit !important;
        font-family: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
      }

      /* Responsive styles */
      @media only screen and (max-width: 600px) {
        .mobile-padding { padding: 20px 15px !important; }
        .mobile-text { font-size: 14px !important; line-height: 1.6 !important; }
        .mobile-heading { font-size: 24px !important; }
        .button { width: 100% !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
    <!-- Preheader text (hidden but used by email clients for preview) -->
    <div style="display: none; max-height: 0; overflow: hidden;">
      ${preheader || title}
    </div>

    <!-- Container table -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
      <tr>
        <td style="padding: 40px 0;">
          <!-- Email wrapper -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px;" class="email-container">

            <!-- Logo/Header section -->
            ${logoUrl ? `
            <tr>
              <td style="padding: 0 0 20px 0; text-align: center;">
                <img src="${logoUrl}" alt="${brandName}" width="150" style="display: block; margin: 0 auto; max-width: 150px; height: auto;" />
              </td>
            </tr>
            ` : ''}

            <!-- Main content card -->
            <tr>
              <td style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="padding: 40px 40px 30px 40px;" class="mobile-padding">
                      ${content}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 30px 20px; text-align: center;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="color: #666666; font-size: 12px; line-height: 1.5; text-align: center;">
                      <p style="margin: 0 0 10px 0;">
                        This is an automated message from ${brandName}.
                      </p>
                      <p style="margin: 0; color: #999999;">
                        &copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * Creates a styled heading for email content.
 */
export function emailHeading(text: string, options?: { color?: string }): string {
  const color = options?.color || '#1f2937';
  return `
    <h1 class="mobile-heading" style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: ${color}; line-height: 1.2;">
      ${text}
    </h1>
  `;
}

/**
 * Creates a styled paragraph for email content.
 */
export function emailParagraph(text: string): string {
  return `
    <p class="mobile-text" style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">
      ${text}
    </p>
  `;
}

/**
 * Creates a styled button/CTA for email content.
 */
export function emailButton(text: string, url: string, options?: { color?: string }): string {
  const color = options?.color || '#3b82f6';
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 6px; background-color: ${color};" class="button">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Creates a styled info box for email content.
 */
export function emailInfoBox(content: string, options?: { backgroundColor?: string }): string {
  const backgroundColor = options?.backgroundColor || '#f9fafb';
  return `
    <div style="background-color: ${backgroundColor}; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
      <div style="font-size: 15px; line-height: 1.6; color: #374151;">
        ${content}
      </div>
    </div>
  `;
}

/**
 * Creates a styled code block for email content.
 */
export function emailCodeBlock(code: string): string {
  return `
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; margin: 24px 0; border-radius: 6px;">
      <code style="font-family: 'Courier New', Courier, monospace; font-size: 14px; color: #1f2937; word-break: break-all; display: block;">
        ${code}
      </code>
    </div>
  `;
}

/**
 * Creates a divider line for email content.
 */
export function emailDivider(): string {
  return `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
  `;
}

/**
 * Creates a signature section for email content.
 */
export function emailSignature(brandName: string = 'Time2Ship'): string {
  return `
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151;">
        Best regards,<br />
        <strong>The ${brandName} Team</strong>
      </p>
    </div>
  `;
}

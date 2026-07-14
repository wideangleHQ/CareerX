export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export type TemplateVariables = Record<string, string | number | boolean | null | undefined>;

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('/', '&#x2F;'); // Additional XSS protection
}

export function textValue(value: unknown): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

export function sanitizeUrl(url: unknown): string {
  const urlString = textValue(url);
  if (!urlString) return '';
  
  // Only allow http/https URLs for security
  if (!/^https?:\/\//i.test(urlString)) return '';
  
  return escapeHtml(urlString);
}

export function validateEmail(email: unknown): string {
  const emailString = textValue(email);
  if (!emailString) return '';
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailString)) return '';
  
  return emailString;
}

export function truncateText(text: unknown, maxLength: number = 500): string {
  const textString = textValue(text);
  if (textString.length <= maxLength) return textString;
  
  return textString.substring(0, maxLength) + '...';
}

export function renderApplicationReceivedTemplate(variables: TemplateVariables): RenderedEmail {
  const name = textValue(variables.candidateName) || 'Candidate';
  const code = textValue(variables.applicationCode);
  const department = textValue(variables.departmentName);
  const company = textValue(variables.companyName) || 'CareerX';
  
  return {
    subject: `Application received${code ? ` - ${code}` : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Application Received</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>Thank you for your interest in joining ${escapeHtml(company)}. Your application${department ? ` for the position in ${escapeHtml(department)}` : ''} has been successfully received and is now under review.</p>
        ${code ? `
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #007bff;">
            <strong>Application Reference:</strong> ${escapeHtml(code)}
          </div>
        ` : ''}
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <strong>What's Next:</strong><br>
          • Our HR team will review your application<br>
          • You will be contacted if your profile matches our requirements<br>
          • Please keep this reference number for future correspondence
        </div>
        <p>We appreciate your patience during our review process.</p>
        <p>Best regards,<br>${escapeHtml(company)} Recruitment Team</p>
      </div>
    `,
    text: `Application Received\n\nHello ${name},\n\nThank you for your interest in joining ${company}. Your application${department ? ` for the position in ${department}` : ''} has been successfully received and is now under review.${code ? `\n\nApplication Reference: ${code}` : ''}\n\nWhat's Next:\n• Our HR team will review your application\n• You will be contacted if your profile matches our requirements\n• Please keep this reference number for future correspondence\n\nWe appreciate your patience during our review process.\n\nBest regards,\n${company} Recruitment Team`,
  };
}

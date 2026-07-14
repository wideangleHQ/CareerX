import { escapeHtml, textValue } from './application-received.template';
import type { RenderedEmail, TemplateVariables } from './application-received.template';

export function renderOfferReleasedTemplate(variables: TemplateVariables): RenderedEmail {
  const name = textValue(variables.candidateName) || 'Candidate';
  const department = textValue(variables.departmentName);
  const position = textValue(variables.positionTitle);
  const offerLink = textValue(variables.offerLink);
  const deadline = textValue(variables.deadline);
  const applicationCode = textValue(variables.applicationCode);

  return {
    subject: `Job Offer - ${position || 'Position'}${applicationCode ? ` - ${applicationCode}` : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4caf50;">🎉 Congratulations - Job Offer!</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>We are delighted to extend a job offer for the ${position ? escapeHtml(position) : 'position'}${department ? ` in our ${escapeHtml(department)} department` : ''}.</p>
        
        <div style="background-color: #e8f5e8; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4caf50; text-align: center;">
          <h3 style="margin-top: 0; color: #2e7d32; font-size: 24px;">Welcome to the Team!</h3>
          <p style="margin-bottom: 0; font-size: 16px;">We're excited to have you join our organization.</p>
        </div>

        ${applicationCode ? `<p><strong>Application Reference:</strong> ${escapeHtml(applicationCode)}</p>` : ''}
        
        ${offerLink ? `
          <div style="text-align: center; margin: 25px 0;">
            <a href="${escapeHtml(offerLink)}" style="background-color: #4caf50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              📄 View Your Offer Letter
            </a>
          </div>
        ` : ''}

        ${deadline ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107;">
            <strong>⏰ Response Deadline:</strong> ${escapeHtml(deadline)}<br>
            Please review and respond to this offer by the deadline mentioned above.
          </div>
        ` : ''}

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <strong>Next Steps:</strong><br>
          1. Review the complete offer letter and terms<br>
          2. Contact us if you have any questions<br>
          3. Submit your acceptance or any counter-proposals<br>
          4. Complete any required background checks or documentation
        </div>

        <p>We believe you'll be a valuable addition to our team and look forward to your positive response.</p>
        
        <p>If you have any questions about the offer, please don't hesitate to contact our HR team.</p>
        
        <p>Best regards,<br>CareerX Team</p>
      </div>
    `,
    text: `Job Offer - Congratulations!\n\nHello ${name},\n\nWe are delighted to extend a job offer for the ${position || 'position'}${department ? ` in our ${department} department` : ''}.\n\nWelcome to the Team! We're excited to have you join our organization.${applicationCode ? `\n\nApplication Reference: ${applicationCode}` : ''}${offerLink ? `\n\nView Your Offer Letter: ${offerLink}` : ''}${deadline ? `\n\nResponse Deadline: ${deadline}\nPlease review and respond to this offer by the deadline mentioned above.` : ''}\n\nNext Steps:\n1. Review the complete offer letter and terms\n2. Contact us if you have any questions\n3. Submit your acceptance or any counter-proposals\n4. Complete any required background checks or documentation\n\nWe believe you'll be a valuable addition to our team and look forward to your positive response.\n\nIf you have any questions about the offer, please don't hesitate to contact our HR team.\n\nBest regards,\nCareerX Team`,
  };
}
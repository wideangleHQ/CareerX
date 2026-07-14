import { escapeHtml, textValue } from './application-received.template';
import type { RenderedEmail, TemplateVariables } from './application-received.template';

export function renderCandidateShortlistedTemplate(variables: TemplateVariables): RenderedEmail {
  const name = textValue(variables.candidateName) || 'Candidate';
  const department = textValue(variables.departmentName);
  const nextSteps = textValue(variables.nextSteps);
  const applicationCode = textValue(variables.applicationCode);

  return {
    subject: `Congratulations - You've Been Shortlisted${applicationCode ? ` - ${applicationCode}` : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4caf50;">Congratulations!</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>We are pleased to inform you that you have been shortlisted for the position${department ? ` in our ${escapeHtml(department)} department` : ''}.</p>
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <h3 style="margin-top: 0; color: #2e7d32;">🎉 You're Moving Forward!</h3>
          <p style="margin-bottom: 0;">Your application stood out among many qualified candidates. We're impressed with your qualifications and experience.</p>
        </div>

        ${applicationCode ? `<p><strong>Application Reference:</strong> ${escapeHtml(applicationCode)}</p>` : ''}
        
        ${nextSteps ? `
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <strong>Next Steps:</strong><br>
            ${escapeHtml(nextSteps)}
          </div>
        ` : `
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <strong>What's Next:</strong><br>
            Our HR team will contact you soon with details about the next stage of the selection process.
          </div>
        `}

        <p>Thank you for your interest in joining our team. We look forward to the next steps in the process.</p>
        <p>Best regards,<br>CareerX Team</p>
      </div>
    `,
    text: `Congratulations - You've Been Shortlisted!\n\nHello ${name},\n\nWe are pleased to inform you that you have been shortlisted for the position${department ? ` in our ${department} department` : ''}.\n\nYour application stood out among many qualified candidates. We're impressed with your qualifications and experience.${applicationCode ? `\n\nApplication Reference: ${applicationCode}` : ''}${nextSteps ? `\n\nNext Steps: ${nextSteps}` : '\n\nWhat\'s Next: Our HR team will contact you soon with details about the next stage of the selection process.'}\n\nThank you for your interest in joining our team. We look forward to the next steps in the process.\n\nBest regards,\nCareerX Team`,
  };
}
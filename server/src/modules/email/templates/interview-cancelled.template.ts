import { escapeHtml, textValue } from './application-received.template';
import type { RenderedEmail, TemplateVariables } from './application-received.template';

export function renderInterviewCancelledTemplate(variables: TemplateVariables): RenderedEmail {
  const name = textValue(variables.candidateName) || 'Candidate';
  const date = textValue(variables.interviewDate);
  const time = textValue(variables.interviewTime);
  const reason = textValue(variables.reason);
  const rescheduleInfo = textValue(variables.rescheduleInfo);

  return {
    subject: 'Interview Cancellation Notice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Interview Cancellation</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>We regret to inform you that we need to cancel your scheduled interview${date && time ? ` on ${escapeHtml(date)} at ${escapeHtml(time)}` : ''}.</p>
        ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ''}
        ${rescheduleInfo ? `
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4caf50;">
            <strong>Rescheduling Information:</strong><br>
            ${escapeHtml(rescheduleInfo)}
          </div>
        ` : ''}
        <p>We apologize for any inconvenience this may cause. If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>CareerX Team</p>
      </div>
    `,
    text: `Interview Cancellation\n\nHello ${name},\n\nWe regret to inform you that we need to cancel your scheduled interview${date && time ? ` on ${date} at ${time}` : ''}.\n${reason ? `\nReason: ${reason}` : ''}${rescheduleInfo ? `\nRescheduling Information: ${rescheduleInfo}` : ''}\n\nWe apologize for any inconvenience this may cause. If you have any questions, please don't hesitate to contact us.\n\nBest regards,\nCareerX Team`,
  };
}
import { escapeHtml, textValue } from './application-received.template';
import type { RenderedEmail, TemplateVariables } from './application-received.template';

export function renderInterviewReminderTemplate(variables: TemplateVariables): RenderedEmail {
  const name = textValue(variables.candidateName) || 'Candidate';
  const date = textValue(variables.interviewDate);
  const time = textValue(variables.interviewTime);
  const department = textValue(variables.departmentName);
  const meetingLink = textValue(variables.meetingLink);
  const instructions = textValue(variables.instructions);

  const dateTimeText = date && time ? ` on ${date} at ${time}` : '';
  
  return {
    subject: 'Interview Reminder - Tomorrow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Interview Reminder</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>This is a friendly reminder that you have an interview scheduled${escapeHtml(dateTimeText)}.</p>
        ${department ? `<p><strong>Department:</strong> ${escapeHtml(department)}</p>` : ''}
        ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${escapeHtml(meetingLink)}">${escapeHtml(meetingLink)}</a></p>` : ''}
        ${instructions ? `<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;"><strong>Instructions:</strong><br>${escapeHtml(instructions)}</div>` : ''}
        <p>We look forward to meeting with you. Please contact us if you have any questions.</p>
        <p>Best regards,<br>CareerX Team</p>
      </div>
    `,
    text: `Interview Reminder\n\nHello ${name},\n\nThis is a friendly reminder that you have an interview scheduled${dateTimeText}.\n${department ? `\nDepartment: ${department}` : ''}${meetingLink ? `\nMeeting Link: ${meetingLink}` : ''}${instructions ? `\nInstructions: ${instructions}` : ''}\n\nWe look forward to meeting with you. Please contact us if you have any questions.\n\nBest regards,\nCareerX Team`,
  };
}
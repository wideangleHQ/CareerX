import { escapeHtml, textValue } from './application-received.template';
import type { RenderedEmail, TemplateVariables } from './application-received.template';

export function renderInterviewRescheduledTemplate(variables: TemplateVariables): RenderedEmail {
  const name = textValue(variables.candidateName) || 'Candidate';
  const oldDate = textValue(variables.oldInterviewDate);
  const oldTime = textValue(variables.oldInterviewTime);
  const newDate = textValue(variables.newInterviewDate);
  const newTime = textValue(variables.newInterviewTime);
  const reason = textValue(variables.reason);
  const meetingLink = textValue(variables.meetingLink);
  const department = textValue(variables.departmentName);

  return {
    subject: 'Interview Rescheduled - New Date and Time',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff9800;">Interview Rescheduled</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>We need to reschedule your upcoming interview. Please note the new date and time below:</p>
        
        ${oldDate && oldTime ? `
          <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f44336;">
            <strong>Previous Schedule:</strong><br>
            ${escapeHtml(oldDate)} at ${escapeHtml(oldTime)}
          </div>
        ` : ''}

        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4caf50;">
          <strong>New Schedule:</strong><br>
          ${newDate && newTime ? `${escapeHtml(newDate)} at ${escapeHtml(newTime)}` : 'To be confirmed'}
        </div>

        ${department ? `<p><strong>Department:</strong> ${escapeHtml(department)}</p>` : ''}
        ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${escapeHtml(meetingLink)}">${escapeHtml(meetingLink)}</a></p>` : ''}
        ${reason ? `<p><strong>Reason for rescheduling:</strong> ${escapeHtml(reason)}</p>` : ''}
        
        <p>We apologize for any inconvenience this may cause. Please confirm your availability for the new schedule.</p>
        <p>Best regards,<br>CareerX Team</p>
      </div>
    `,
    text: `Interview Rescheduled\n\nHello ${name},\n\nWe need to reschedule your upcoming interview. Please note the new date and time below:\n${oldDate && oldTime ? `\nPrevious Schedule: ${oldDate} at ${oldTime}` : ''}\nNew Schedule: ${newDate && newTime ? `${newDate} at ${newTime}` : 'To be confirmed'}${department ? `\nDepartment: ${department}` : ''}${meetingLink ? `\nMeeting Link: ${meetingLink}` : ''}${reason ? `\nReason for rescheduling: ${reason}` : ''}\n\nWe apologize for any inconvenience this may cause. Please confirm your availability for the new schedule.\n\nBest regards,\nCareerX Team`,
  };
}
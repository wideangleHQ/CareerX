import { escapeHtml, textValue } from './application-received.template';
import type { RenderedEmail, TemplateVariables } from './application-received.template';

export function renderInterviewInvitationTemplate(variables: TemplateVariables): RenderedEmail {
  const name = textValue(variables.candidateName) || 'Candidate';
  const date = textValue(variables.interviewDate);
  const time = textValue(variables.interviewTime);
  return {
    subject: 'Interview invitation',
    html: `<p>Hello ${escapeHtml(name)},</p><p>Your interview has been scheduled${date ? ` on ${escapeHtml(date)}` : ''}${time ? ` at ${escapeHtml(time)}` : ''}.</p>`,
    text: `Hello ${name}, your interview has been scheduled${date ? ` on ${date}` : ''}${time ? ` at ${time}` : ''}.`,
  };
}

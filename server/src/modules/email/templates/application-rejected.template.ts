import { escapeHtml, textValue } from './application-received.template';
import type { RenderedEmail, TemplateVariables } from './application-received.template';

export function renderApplicationRejectedTemplate(variables: TemplateVariables): RenderedEmail {
  const name = textValue(variables.candidateName) || 'Candidate';
  const reason = textValue(variables.reason);
  return {
    subject: 'Application update',
    html: `<p>Hello ${escapeHtml(name)},</p><p>Thank you for applying. We are unable to move forward with your application at this time.</p>${reason ? `<p>${escapeHtml(reason)}</p>` : ''}`,
    text: `Hello ${name}, thank you for applying. We are unable to move forward with your application at this time.${reason ? ` ${reason}` : ''}`,
  };
}

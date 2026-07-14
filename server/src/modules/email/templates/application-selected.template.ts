import { escapeHtml, textValue } from './application-received.template';
import type { RenderedEmail, TemplateVariables } from './application-received.template';

export function renderApplicationSelectedTemplate(variables: TemplateVariables): RenderedEmail {
  const name = textValue(variables.candidateName) || 'Candidate';
  const code = textValue(variables.applicationCode);
  return {
    subject: `Application selected${code ? ` - ${code}` : ''}`,
    html: `<p>Hello ${escapeHtml(name)},</p><p>Congratulations. Your application has been selected.</p>`,
    text: `Hello ${name}, congratulations. Your application has been selected.`,
  };
}

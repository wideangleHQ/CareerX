import { escapeHtml, textValue } from './application-received.template';
import type { RenderedEmail, TemplateVariables } from './application-received.template';

export function renderHrAssignmentTemplate(variables: TemplateVariables): RenderedEmail {
  const hrName = textValue(variables.hrName) || 'HR Team Member';
  const candidateName = textValue(variables.candidateName);
  const department = textValue(variables.departmentName);
  const position = textValue(variables.positionTitle);
  const applicationCode = textValue(variables.applicationCode);
  const dashboardLink = textValue(variables.dashboardLink);
  const dueDate = textValue(variables.dueDate);

  return {
    subject: `New Application Assignment${applicationCode ? ` - ${applicationCode}` : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">📋 New Application Assignment</h2>
        <p>Hello ${escapeHtml(hrName)},</p>
        <p>A new application has been assigned to you for review and processing.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
          <h3 style="margin-top: 0; color: #1565c0;">Application Details</h3>
          ${candidateName ? `<p><strong>Candidate:</strong> ${escapeHtml(candidateName)}</p>` : ''}
          ${position ? `<p><strong>Position:</strong> ${escapeHtml(position)}</p>` : ''}
          ${department ? `<p><strong>Department:</strong> ${escapeHtml(department)}</p>` : ''}
          ${applicationCode ? `<p><strong>Reference Code:</strong> ${escapeHtml(applicationCode)}</p>` : ''}
          ${dueDate ? `<p><strong>Review Due Date:</strong> ${escapeHtml(dueDate)}</p>` : ''}
        </div>

        ${dashboardLink ? `
          <div style="text-align: center; margin: 25px 0;">
            <a href="${escapeHtml(dashboardLink)}" style="background-color: #1976d2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              🔍 Review Application
            </a>
          </div>
        ` : ''}

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107;">
          <strong>Required Actions:</strong><br>
          • Review candidate's application and resume<br>
          • Schedule initial screening if qualified<br>
          • Update application status in the system<br>
          • Document any notes or feedback
        </div>

        <p>Please process this application in a timely manner to ensure a positive candidate experience.</p>
        <p>If you have any questions or need assistance, please contact the admin team.</p>
        
        <p>Best regards,<br>CareerX System</p>
      </div>
    `,
    text: `New Application Assignment\n\nHello ${hrName},\n\nA new application has been assigned to you for review and processing.\n\nApplication Details:${candidateName ? `\nCandidate: ${candidateName}` : ''}${position ? `\nPosition: ${position}` : ''}${department ? `\nDepartment: ${department}` : ''}${applicationCode ? `\nReference Code: ${applicationCode}` : ''}${dueDate ? `\nReview Due Date: ${dueDate}` : ''}${dashboardLink ? `\n\nReview Application: ${dashboardLink}` : ''}\n\nRequired Actions:\n• Review candidate's application and resume\n• Schedule initial screening if qualified\n• Update application status in the system\n• Document any notes or feedback\n\nPlease process this application in a timely manner to ensure a positive candidate experience.\n\nIf you have any questions or need assistance, please contact the admin team.\n\nBest regards,\nCareerX System`,
  };
}
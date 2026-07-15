import { useMutation } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import { interviewsApi } from '@/src/api/interviews';
import type { CandidateApplicationData } from '../schemas/application.schema';

export function useSubmitApplication() {
  return useMutation({
    mutationFn: async (data: CandidateApplicationData) => {
      const applicationRes = await applicationsApi.create({
        fullName: data.fullName,
        email: data.email,
        mobileNumber: data.mobileNumber,
        whatsappNumber: data.whatsappNumber || null,
        departmentId: data.departmentId,
        opportunityId: data.opportunityId,
        selfDescription: data.selfDescription,
        experienceYears: data.experienceYears,
        resumePath: data.resume?.name || 'resume.pdf',
        previousOrgProofPath: data.previousOrgProof?.name || null,
      });

      if (!applicationRes.success || !applicationRes.data.id) {
        throw new Error('Failed to submit application');
      }

      const applicationId = applicationRes.data.id;

      if (data.slotId) {
        const bookingRes = await interviewsApi.book({
          applicationId,
          slotId: data.slotId,
        });

        if (!bookingRes.success) {
          throw new Error('Failed to book interview slot');
        }

        return {
          application: applicationRes.data,
          booking: bookingRes.data,
        };
      }

      return {
        application: applicationRes.data,
        booking: null,
      };
    },
  });
}

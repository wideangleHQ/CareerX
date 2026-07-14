import { useMutation } from '@tanstack/react-query';
import { candidatesApi } from '@/src/api/candidates';
import { applicationsApi } from '@/src/api/applications';
import { interviewsApi } from '@/src/api/interviews';
import type { CandidateApplicationData } from '../schemas/application.schema';

export function useSubmitApplication() {
  return useMutation({
    mutationFn: async (data: CandidateApplicationData) => {
      // 1. Create candidate
      const candidateRes = await candidatesApi.create({
        fullName: data.fullName,
        email: data.email,
        mobileNumber: data.mobileNumber,
        whatsappNumber: data.whatsappNumber || null,
      });

      if (!candidateRes.success || !candidateRes.data.id) {
        throw new Error('Failed to create candidate profile');
      }

      const candidateId = candidateRes.data.id;

      // 2. Create application
      const applicationRes = await applicationsApi.create({
        fullName: data.fullName,
        email: data.email,
        mobileNumber: data.mobileNumber,
        whatsappNumber: data.whatsappNumber || null,
        departmentId: data.departmentId,
        selfDescription: data.selfDescription,
        resumePath: data.resume?.name || 'resume.pdf',
      });

      if (!applicationRes.success || !applicationRes.data.id) {
        throw new Error('Failed to submit application');
      }

      const applicationId = applicationRes.data.id;

      // 3. Book slot
      const bookingRes = await interviewsApi.book({
        applicationId,
        slotId: data.slotId,
      });

      if (!bookingRes.success) {
        throw new Error('Failed to book interview slot');
      }

      return {
        candidate: candidateRes.data,
        application: applicationRes.data,
        booking: bookingRes.data,
      };
    },
  });
}

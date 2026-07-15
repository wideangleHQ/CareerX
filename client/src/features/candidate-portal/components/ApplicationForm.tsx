'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { candidateApplicationSchema, type CandidateApplicationData } from '../schemas/application.schema';
import { useSubmitApplication } from '../hooks/useSubmitApplication';
import { opportunitiesApi } from '@/src/api/opportunities';
import { ResumeUpload } from './ResumeUpload';
import { OrgProofUpload } from './OrgProofUpload';
import { InterviewSlotPicker } from './InterviewSlotPicker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubmissionSuccess } from './SubmissionSuccess';
import { Loader2, Briefcase, Building2 } from 'lucide-react';

const EXPERIENCE_OPTIONS = [
  { value: 0, label: 'Fresher' },
  { value: 1, label: '1 Year' },
  { value: 2, label: '2 Years' },
  { value: 3, label: '3 Years' },
  { value: 4, label: '4 Years' },
  { value: 5, label: '5 Years' },
  { value: 6, label: '6+ Years' },
];

export function ApplicationForm() {
  const searchParams = useSearchParams();
  const opportunityId = searchParams.get('opportunityId');
  const submitMutation = useSubmitApplication();
  const [successData, setSuccessData] = useState<any | null>(null);

  const { data: opportunityRes, isLoading: isLoadingOpportunity } = useQuery({
    queryKey: ['opportunity-public', opportunityId],
    queryFn: () => opportunitiesApi.findPublic(),
    enabled: !!opportunityId,
  });

  const opportunity = opportunityRes?.data?.find(
    (o: any) => o.opportunityId === opportunityId
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CandidateApplicationData>({
    resolver: zodResolver(candidateApplicationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      mobileNumber: '',
      whatsappNumber: '',
      departmentId: '',
      opportunityId: '',
      experienceYears: undefined as any,
      slotId: '',
      resume: null,
      previousOrgProof: undefined,
      selfDescription: '',
    },
  });

  useEffect(() => {
    if (opportunity) {
      setValue('opportunityId', opportunity.opportunityId);
      setValue('departmentId', opportunity.departmentId);
    }
  }, [opportunity, setValue]);

  const experienceYears = watch('experienceYears');
  const selectedDepartmentId = watch('departmentId');
  const showOrgProof = typeof experienceYears === 'number' && experienceYears >= 1;

  useEffect(() => {
    if (!showOrgProof) {
      setValue('previousOrgProof', undefined);
    }
  }, [showOrgProof, setValue]);

  const onSubmit = async (data: CandidateApplicationData) => {
    try {
      const res = await submitMutation.mutateAsync(data);
      setSuccessData({
        application: res.application,
        slotId: data.slotId || null,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (successData) {
    return <SubmissionSuccess data={successData} />;
  }

  if (opportunityId && isLoadingOpportunity) {
    return (
      <Card className="w-full max-w-2xl border-neutral-200">
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (opportunityId && !opportunity && !isLoadingOpportunity) {
    return (
      <Card className="w-full max-w-2xl border-neutral-200">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">This opportunity is no longer available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl border-neutral-200">
      <CardHeader className="space-y-1 bg-neutral-50/50 border-b p-6">
        <CardTitle className="text-2xl font-bold text-black">Job Application</CardTitle>
        <CardDescription className="text-neutral-500">
          Fill in your details below to apply.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-black">Full Name</label>
              <Input
                {...register('fullName')}
                placeholder="John Doe"
                className={errors.fullName ? 'border-destructive ring-destructive/20' : ''}
              />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-black">Email Address</label>
              <Input
                type="email"
                {...register('email')}
                placeholder="john@example.com"
                className={errors.email ? 'border-destructive ring-destructive/20' : ''}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          {/* Phone Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-black">Mobile Number</label>
              <Input
                {...register('mobileNumber')}
                placeholder="+919999999999"
                className={errors.mobileNumber ? 'border-destructive ring-destructive/20' : ''}
              />
              {errors.mobileNumber && <p className="text-xs text-red-500">{errors.mobileNumber.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-black">WhatsApp Number (Optional)</label>
              <Input
                {...register('whatsappNumber')}
                placeholder="+919999999999"
                className={errors.whatsappNumber ? 'border-destructive ring-destructive/20' : ''}
              />
              {errors.whatsappNumber && <p className="text-xs text-red-500">{errors.whatsappNumber.message}</p>}
            </div>
          </div>

          {/* Applying For (read-only from opportunity) */}
          {opportunity && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-black">Applying For</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-neutral-200 bg-neutral-50 text-sm text-black">
                  <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{opportunity.name}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-black">Department</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-neutral-200 bg-neutral-50 text-sm text-black">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{opportunity.departmentName}</span>
                </div>
              </div>
            </div>
          )}

          {/* Experience Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-black">Experience</label>
            <Controller
              name="experienceYears"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={typeof field.value === 'number' ? String(field.value) : ''}
                >
                  <SelectTrigger className={errors.experienceYears ? 'border-destructive ring-destructive/20' : ''}>
                    <SelectValue placeholder="Select your experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.experienceYears && <p className="text-xs text-red-500">{errors.experienceYears.message}</p>}
          </div>

          {/* Resume Upload */}
          <Controller
            name="resume"
            control={control}
            render={({ field }) => (
              <ResumeUpload
                value={field.value}
                onChange={field.onChange}
                error={errors.resume?.message as string}
              />
            )}
          />

          {/* Conditional Org Proof Upload */}
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: showOrgProof ? '300px' : '0px',
              opacity: showOrgProof ? 1 : 0,
            }}
          >
            <Controller
              name="previousOrgProof"
              control={control}
              render={({ field }) => (
                <OrgProofUpload
                  value={field.value ?? null}
                  onChange={field.onChange}
                  error={errors.previousOrgProof?.message as string}
                />
              )}
            />
          </div>

          {/* Self Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-black">Brief Introduction</label>
            <Textarea
              {...register('selfDescription')}
              placeholder="Tell us about your professional background and why you are a good fit for this role..."
              rows={4}
              className={errors.selfDescription ? 'border-destructive ring-destructive/20' : ''}
            />
            {errors.selfDescription && <p className="text-xs text-red-500">{errors.selfDescription.message}</p>}
          </div>

          {/* Interview Slot Picker */}
          {selectedDepartmentId && (
            <Controller
              name="slotId"
              control={control}
              render={({ field }) => (
                <InterviewSlotPicker
                  departmentId={selectedDepartmentId}
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={errors.slotId?.message}
                />
              )}
            />
          )}

          {/* Error Message */}
          {submitMutation.isError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg p-3">
              {(submitMutation.error as any).message || 'Failed to submit application. Please try again.'}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-10 font-semibold cursor-pointer"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Application...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
export default ApplicationForm;

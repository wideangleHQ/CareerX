import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OpportunityWizardSchema, type OpportunityWizardData } from '../schemas/opportunity.schema';
import { useCreateOpportunity, useUpdateOpportunity } from '../hooks/useOpportunityMutations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '@/src/api/departments';
import { Label } from '@/components/ui/label';

interface CreateOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityToEdit?: any;
}

export function CreateOpportunityDialog({ open, onOpenChange, opportunityToEdit }: CreateOpportunityDialogProps) {
  const [step, setStep] = useState(1);
  const createMutation = useCreateOpportunity();
  const updateMutation = useUpdateOpportunity();

  const { data: deptsRes } = useQuery({
    queryKey: ['departments', 'active'],
    queryFn: () => departmentsApi.findAll({ limit: 100 }),
  });
  const departments = deptsRes?.data || [];

  const form = useForm<OpportunityWizardData>({
    resolver: zodResolver(OpportunityWizardSchema),
    defaultValues: opportunityToEdit || {
      department_id: '',
      internal_position: '',
      number_of_openings: 1,
      hiring_priority: 'MEDIUM',
      hiring_type: 'FULL_TIME',
      career_level: 'MID_LEVEL',
      work_mode: 'ON_SITE',
      public_title: '',
      about: '',
      location: '',
      resume_required: true,
      employment_proof_required: false,
    },
  });

  const onSubmit = (data: OpportunityWizardData) => {
    if (opportunityToEdit) {
      updateMutation.mutate({ id: opportunityToEdit.id, data }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  const isLastStep = step === 4;

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ['internal_position', 'department_id', 'hiring_priority', 'hiring_type', 'career_level', 'number_of_openings'];
    if (step === 2) fieldsToValidate = ['public_title', 'about', 'responsibilities', 'work_mode', 'location', 'min_experience_years'];
    if (step === 3) fieldsToValidate = ['resume_required', 'employment_proof_required'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(step + 1);
  };

  return (
    <Dialog modal={false} open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) {
        setStep(1);
        form.reset({
          department_id: '',
          internal_position: '',
          number_of_openings: 1,
          hiring_priority: 'MEDIUM',
          hiring_type: 'FULL_TIME',
          career_level: 'MID_LEVEL',
          work_mode: 'ON_SITE',
          public_title: '',
          about: '',
          location: '',
          resume_required: true,
          employment_proof_required: false,
        });
      }
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{opportunityToEdit ? 'Edit Opportunity' : 'Create New Opportunity'}</DialogTitle>
          <DialogDescription>
            Step {step} of 4. Fill in the details below to publish a new hiring opportunity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Internal Position Name</Label>
                <Input {...form.register('internal_position')} placeholder="e.g. Senior Backend Engineer" />
                {form.formState.errors.internal_position && <span className="text-xs text-red-500">{form.formState.errors.internal_position.message}</span>}
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Controller
                  control={form.control}
                  name="department_id"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.department_id && <span className="text-xs text-red-500">{form.formState.errors.department_id.message}</span>}
              </div>

              <div className="space-y-2">
                <Label>Hiring Type</Label>
                <Controller
                  control={form.control}
                  name="hiring_type"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="INTERNSHIP">Internship</SelectItem>
                        <SelectItem value="FREELANCE">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Career Level</Label>
                <Controller
                  control={form.control}
                  name="career_level"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTRY_LEVEL">Entry Level</SelectItem>
                        <SelectItem value="JUNIOR">Junior</SelectItem>
                        <SelectItem value="MID_LEVEL">Mid Level</SelectItem>
                        <SelectItem value="SENIOR">Senior</SelectItem>
                        <SelectItem value="LEAD">Lead</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="DIRECTOR">Director</SelectItem>
                        <SelectItem value="EXECUTIVE">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Number of Openings</Label>
                <Input type="number" {...form.register('number_of_openings')} />
              </div>

              <div className="space-y-2">
                <Label>Hiring Priority</Label>
                <Controller
                  control={form.control}
                  name="hiring_priority"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label>Internal Notes (Not visible to candidates)</Label>
                <Textarea {...form.register('internal_notes')} placeholder="Budget, target companies, etc." />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Public Title (Visible on Career Portal)</Label>
                <Input {...form.register('public_title')} placeholder="e.g. Lead Software Engineer (Node.js)" />
                {form.formState.errors.public_title && <span className="text-xs text-red-500">{form.formState.errors.public_title.message}</span>}
              </div>

              <div className="space-y-2 col-span-2">
                <Label>About the Opportunity</Label>
                <Textarea {...form.register('about')} className="min-h-[100px]" />
                {form.formState.errors.about && <span className="text-xs text-red-500">{form.formState.errors.about.message}</span>}
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Responsibilities</Label>
                <Textarea {...form.register('responsibilities')} className="min-h-[100px]" />
              </div>

              <div className="space-y-2">
                <Label>Work Mode</Label>
                <Controller
                  control={form.control}
                  name="work_mode"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ON_SITE">On-Site</SelectItem>
                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                        <SelectItem value="REMOTE">Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input {...form.register('location')} placeholder="e.g. New York, NY" />
              </div>

              <div className="space-y-2">
                <Label>Min Experience (Years)</Label>
                <Input type="number" {...form.register('min_experience_years')} />
              </div>
              <div className="space-y-2">
                <Label>Max Experience (Years)</Label>
                <Input type="number" {...form.register('max_experience_years')} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox id="resume" checked={form.watch('resume_required')} onCheckedChange={(val: boolean) => form.setValue('resume_required', val)} />
                <Label htmlFor="resume">Require Resume / CV from candidates</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="employment_proof" checked={form.watch('employment_proof_required')} onCheckedChange={(val: boolean) => form.setValue('employment_proof_required', val)} />
                <Label htmlFor="employment_proof">Require Employment Proof (Offer letter, Salary slips)</Label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 text-center py-8">
              <h3 className="text-lg font-medium">Ready to save?</h3>
              <p className="text-sm text-neutral-500">
                You can save this opportunity as a Draft and publish it later from the actions menu. 
                Before publishing, ensure all details are correct.
              </p>
            </div>
          )}

          <div className="flex justify-between w-full pt-4">
            <Button type="button" variant="outline" onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}>
              {step > 1 ? 'Back' : 'Cancel'}
            </Button>
            {isLastStep ? (
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Save Opportunity
              </Button>
            ) : (
              <Button type="button" onClick={handleNext}>Next Step</Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

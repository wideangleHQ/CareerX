'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GenerateOfferSchema, type GenerateOfferData } from '../schemas/offer.schema';
import { useGenerateOffer } from '../hooks/useOfferMutations';

interface GenerateOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
}

export function GenerateOfferDialog({ open, onOpenChange, applicationId }: GenerateOfferDialogProps) {
  const generateOffer = useGenerateOffer();

  const form = useForm<GenerateOfferData>({
    resolver: zodResolver(GenerateOfferSchema),
    defaultValues: {
      applicationId,
      salary: 0,
      currency: 'INR',
      joiningDate: '',
      expiryDate: '',
      employmentType: '',
      location: '',
      reportingManager: '',
      remarks: '',
    },
  });

  const onSubmit = async (data: GenerateOfferData) => {
    await generateOffer.mutateAsync(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">Generate Offer</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Fill in the offer details. The candidate will be notified once the offer is released.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="salary" className="text-xs font-semibold text-neutral-700">Salary *</Label>
              <Input
                id="salary"
                type="number"
                placeholder="e.g. 800000"
                {...form.register('salary')}
                className="bg-neutral-50/50"
              />
              {form.formState.errors.salary && (
                <span className="text-xs text-red-500">{form.formState.errors.salary.message}</span>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency" className="text-xs font-semibold text-neutral-700">Currency *</Label>
              <Select
                value={form.watch('currency')}
                onValueChange={(val) => form.setValue('currency', val)}
              >
                <SelectTrigger className="bg-neutral-50/50">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="joiningDate" className="text-xs font-semibold text-neutral-700">Joining Date</Label>
              <Input
                id="joiningDate"
                type="date"
                {...form.register('joiningDate')}
                className="bg-neutral-50/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiryDate" className="text-xs font-semibold text-neutral-700">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                {...form.register('expiryDate')}
                className="bg-neutral-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="employmentType" className="text-xs font-semibold text-neutral-700">Employment Type</Label>
              <Select
                value={form.watch('employmentType') || ''}
                onValueChange={(val) => form.setValue('employmentType', val)}
              >
                <SelectTrigger className="bg-neutral-50/50">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-semibold text-neutral-700">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Mumbai"
                {...form.register('location')}
                className="bg-neutral-50/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reportingManager" className="text-xs font-semibold text-neutral-700">Reporting Manager</Label>
            <Input
              id="reportingManager"
              placeholder="e.g. Rajesh Kumar"
              {...form.register('reportingManager')}
              className="bg-neutral-50/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remarks" className="text-xs font-semibold text-neutral-700">Remarks</Label>
            <Textarea
              id="remarks"
              placeholder="Additional notes or conditions..."
              {...form.register('remarks')}
              className="bg-neutral-50/50 resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <DialogClose
              render={<Button type="button" variant="outline" className="cursor-pointer">Cancel</Button>}
            />
            <Button
              type="submit"
              disabled={generateOffer.isPending}
              className="cursor-pointer"
            >
              {generateOffer.isPending ? 'Generating...' : 'Generate Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

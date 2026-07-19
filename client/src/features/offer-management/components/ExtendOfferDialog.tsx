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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExtendOfferSchema, type ExtendOfferData } from '../schemas/offer.schema';
import { useExtendOffer } from '../hooks/useOfferMutations';

interface ExtendOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
}

export function ExtendOfferDialog({ open, onOpenChange, applicationId }: ExtendOfferDialogProps) {
  const extendOffer = useExtendOffer();

  const form = useForm<ExtendOfferData>({
    resolver: zodResolver(ExtendOfferSchema),
    defaultValues: {
      expiryDate: '',
      joiningDate: '',
    },
  });

  const onSubmit = async (data: ExtendOfferData) => {
    await extendOffer.mutateAsync({ applicationId, data });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">Extend Offer</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Set a new expiry and optional joining date.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label htmlFor="expiryDate" className="text-xs font-semibold text-neutral-700">New Expiry Date *</Label>
            <Input
              id="expiryDate"
              type="date"
              {...form.register('expiryDate')}
              className="bg-neutral-50/50"
            />
            {form.formState.errors.expiryDate && (
              <span className="text-xs text-red-500">{form.formState.errors.expiryDate.message}</span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="joiningDate" className="text-xs font-semibold text-neutral-700">New Joining Date</Label>
            <Input
              id="joiningDate"
              type="date"
              {...form.register('joiningDate')}
              className="bg-neutral-50/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <DialogClose
              render={<Button type="button" variant="outline" className="cursor-pointer">Cancel</Button>}
            />
            <Button
              type="submit"
              disabled={extendOffer.isPending}
              className="cursor-pointer"
            >
              {extendOffer.isPending ? 'Extending...' : 'Extend Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BulkSlotForm } from './BulkSlotForm';
import { Plus } from 'lucide-react';

export function SlotGeneratorDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="cursor-pointer font-semibold">
            <Plus className="mr-1.5 h-4 w-4" /> Batch Generate Slots
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Interview Slots</DialogTitle>
          <DialogDescription>
            Schedule multiple slots in bulk. Candidates will be able to pick these slots during job application.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <BulkSlotForm onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default SlotGeneratorDialog;

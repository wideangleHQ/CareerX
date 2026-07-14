import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSignature, CheckCircle, XCircle } from 'lucide-react';
import type { Application, Offer } from '@/src/api/types';
import { cn } from '@/src/lib/utils';

interface WorkspaceOfferTabProps {
  application: Application | null;
  offer: Offer | null;
  isLoading: boolean;
}

export function WorkspaceOfferTab({ application, offer, isLoading }: WorkspaceOfferTabProps) {
  if (!application) return null;

  if (isLoading) {
    return <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">Loading offer details...</div>;
  }

  if (!offer) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-neutral-900">Offer Management</h3>
          <Button size="sm" className="bg-primary text-white cursor-pointer hover:bg-primary/90">
            Generate Offer
          </Button>
        </div>
        
        <Card className="border-neutral-200 border-dashed bg-neutral-50/50">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-white border rounded-full flex items-center justify-center mb-4 shadow-sm">
              <FileSignature className="h-6 w-6 text-neutral-400" />
            </div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-1">No Offer Generated</h4>
            <p className="text-xs text-muted-foreground mb-4 max-w-[300px] mx-auto">
              An offer has not been created for this candidate yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-700 border-green-200';
      case 'DECLINED': return 'bg-red-100 text-red-700 border-red-200';
      case 'RELEASED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'GENERATED': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CANCELLED': return 'bg-neutral-100 text-neutral-700 border-neutral-200';
      default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
          Offer Details
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border uppercase", getStatusColor(offer.status))}>
            {offer.status}
          </span>
        </h3>
        
        <div className="flex gap-2">
          {offer.status === 'GENERATED' && (
            <Button size="sm" variant="default" className="cursor-pointer bg-blue-600 hover:bg-blue-700">Release Offer</Button>
          )}
          {offer.status === 'RELEASED' && (
            <>
              <Button size="sm" variant="outline" className="cursor-pointer text-green-600 border-green-200 hover:bg-green-50">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept
              </Button>
              <Button size="sm" variant="outline" className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50">
                <XCircle className="w-3.5 h-3.5 mr-1" /> Decline
              </Button>
            </>
          )}
          {['GENERATED', 'RELEASED'].includes(offer.status) && (
            <Button size="sm" variant="outline" className="cursor-pointer text-neutral-600 hover:text-red-600">Cancel Offer</Button>
          )}
        </div>
      </div>

      <Card className="border-neutral-200">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
            <div className="p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Salary</p>
              <p className="text-base font-bold text-neutral-900">{offer.currency} {offer.salary.toLocaleString()}</p>
            </div>
            <div className="p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Joining Date</p>
              <p className="text-sm font-semibold text-neutral-900">
                {offer.joining_date ? new Date(offer.joining_date).toLocaleDateString() : 'TBD'}
              </p>
            </div>
            <div className="p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Expiry Date</p>
              <p className="text-sm font-semibold text-neutral-900">
                {offer.expiry_date ? new Date(offer.expiry_date).toLocaleDateString() : 'None'}
              </p>
            </div>
            <div className="p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Offer Ref</p>
              <p className="text-sm font-mono text-neutral-700">{offer.offer_reference}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Could add offer letter document preview here if one is generated */}
    </div>
  );
}

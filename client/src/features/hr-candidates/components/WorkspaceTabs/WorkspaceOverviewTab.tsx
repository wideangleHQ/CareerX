import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import type { Candidate, Application } from '@/src/api/types';

interface WorkspaceOverviewTabProps {
  candidate: Candidate;
  application: Application | null;
}

export function WorkspaceOverviewTab({ candidate, application }: WorkspaceOverviewTabProps) {
  return (
    <div className="space-y-6">
      <Card className="border-neutral-200">
        <CardHeader className="bg-neutral-50/20 border-b p-6">
          <CardTitle className="text-base font-bold">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-neutral-400 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-semibold text-black mt-0.5">{candidate.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-neutral-400 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-semibold text-black mt-0.5">{candidate.mobile_number}</p>
            </div>
          </div>
          {candidate.whatsapp_number && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-green-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="font-semibold text-black mt-0.5">{candidate.whatsapp_number}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {application && (
        <Card className="border-neutral-200">
          <CardHeader className="bg-neutral-50/20 border-b p-6">
            <CardTitle className="text-base font-bold">Application Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Self Description</p>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{application.self_description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
              <div>
                <p className="text-xs text-muted-foreground">Applied Department</p>
                <p className="text-sm font-semibold mt-0.5">{application.department?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Application Date</p>
                <p className="text-sm font-semibold mt-0.5">{new Date(application.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholders for Experience & Education which would come from a parsed resume or candidate profile fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-neutral-200">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex items-center justify-center min-h-[100px]">
            <p className="text-xs text-muted-foreground italic">No experience data extracted yet.</p>
          </CardContent>
        </Card>
        
        <Card className="border-neutral-200">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Education
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex items-center justify-center min-h-[100px]">
            <p className="text-xs text-muted-foreground italic">No education data extracted yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

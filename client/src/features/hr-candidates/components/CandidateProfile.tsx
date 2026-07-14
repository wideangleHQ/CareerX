'use client';

import React, { useState } from 'react';
import { useCandidateWorkspace } from '../hooks/useCandidateWorkspace';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Phone, Mail, MessageCircle, FileSignature, CheckCircle, Briefcase, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Tabs imports
import { WorkspaceOverviewTab } from './WorkspaceTabs/WorkspaceOverviewTab';
import { WorkspaceTimelineTab } from './WorkspaceTabs/WorkspaceTimelineTab';
import { WorkspaceDocumentsTab } from './WorkspaceTabs/WorkspaceDocumentsTab';
import { WorkspaceInterviewTab } from './WorkspaceTabs/WorkspaceInterviewTab';
import { WorkspaceFeedbackTab } from './WorkspaceTabs/WorkspaceFeedbackTab';
import { WorkspaceHRNotesTab } from './WorkspaceTabs/WorkspaceHRNotesTab';
import { WorkspaceOfferTab } from './WorkspaceTabs/WorkspaceOfferTab';
import { WorkspaceActivityTab } from './WorkspaceTabs/WorkspaceActivityTab';

interface CandidateProfileProps {
  candidateId: string;
}

export function CandidateProfile({ candidateId }: CandidateProfileProps) {
  const {
    candidate,
    activeApplication,
    timeline,
    activity,
    offer,
    isLoading,
    isLoadingTimeline,
    isLoadingActivity,
    isLoadingOffer
  } = useCandidateWorkspace(candidateId);

  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Candidate profile not found.
      </div>
    );
  }

  // Derived properties
  const initials = candidate.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
    
  const getStatusBadgeVariant = (status: string | undefined) => {
    switch (status) {
      case 'SELECTED': return 'bg-green-100 text-green-700 hover:bg-green-100';
      case 'REJECTED': return 'bg-red-100 text-red-700 hover:bg-red-100';
      case 'INTERVIEWED': return 'bg-purple-100 text-purple-700 hover:bg-purple-100';
      case 'SLOT_BOOKED': return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
      default: return 'bg-neutral-100 text-neutral-700 hover:bg-neutral-100'; // NEW, etc.
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Sidebar - Candidate Summary & Quick Actions */}
      <div className="w-full lg:w-80 shrink-0 space-y-6">
        <Card className="border-neutral-200 overflow-hidden relative">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 absolute top-0 w-full" />
          <CardContent className="pt-12 px-6 pb-6 relative z-10 flex flex-col items-center">
            <div className="h-24 w-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-neutral-400 mb-4">
              {initials}
            </div>
            
            <h1 className="text-xl font-bold text-center text-black leading-tight">
              {candidate.full_name}
            </h1>
            
            {activeApplication && (
              <Badge className={cn("mt-3 mb-1 text-[11px] font-bold tracking-wider", getStatusBadgeVariant(activeApplication.status))}>
                {activeApplication.status.replace('_', ' ')}
              </Badge>
            )}

            <p className="text-sm text-muted-foreground mt-2 font-medium text-center">
              {activeApplication?.department?.name || 'No Department Assigned'}
            </p>
            
            <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider font-semibold">
              App ID: {activeApplication?.application_code || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 px-2">Quick Actions</h3>
            <Button variant="ghost" className="w-full justify-start text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 h-9">
              <Download className="mr-2 h-4 w-4" /> Download Resume
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm cursor-pointer hover:bg-green-50 hover:text-green-600 h-9">
              <Phone className="mr-2 h-4 w-4" /> Call Candidate
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm cursor-pointer hover:bg-purple-50 hover:text-purple-600 h-9">
              <Mail className="mr-2 h-4 w-4" /> Email Candidate
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm cursor-pointer hover:bg-amber-50 hover:text-amber-600 h-9">
              <MessageCircle className="mr-2 h-4 w-4" /> Add HR Note
            </Button>
            <Button variant="default" className="w-full justify-start text-sm cursor-pointer bg-neutral-900 hover:bg-neutral-800 h-9 mt-4">
              <CheckCircle className="mr-2 h-4 w-4" /> Update Status
            </Button>
            {activeApplication?.status === 'SELECTED' && (
              <Button variant="default" className="w-full justify-start text-sm cursor-pointer bg-blue-600 hover:bg-blue-700 h-9">
                <FileSignature className="mr-2 h-4 w-4" /> Generate Offer
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Content - Tabs */}
      <div className="flex-1 min-w-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2 custom-scrollbar">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-12 p-0 space-x-6 min-w-max">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-1 py-3 text-sm text-neutral-500 cursor-pointer font-medium"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="timeline"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-1 py-3 text-sm text-neutral-500 cursor-pointer font-medium"
              >
                Timeline
              </TabsTrigger>
              <TabsTrigger 
                value="documents"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-1 py-3 text-sm text-neutral-500 cursor-pointer font-medium"
              >
                Documents
              </TabsTrigger>
              <TabsTrigger 
                value="interview"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-1 py-3 text-sm text-neutral-500 cursor-pointer font-medium"
              >
                Interview
              </TabsTrigger>
              <TabsTrigger 
                value="feedback"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-1 py-3 text-sm text-neutral-500 cursor-pointer font-medium"
              >
                Feedback
              </TabsTrigger>
              <TabsTrigger 
                value="notes"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-1 py-3 text-sm text-neutral-500 cursor-pointer font-medium"
              >
                HR Notes
              </TabsTrigger>
              <TabsTrigger 
                value="offer"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-1 py-3 text-sm text-neutral-500 cursor-pointer font-medium"
              >
                Offer
              </TabsTrigger>
              <TabsTrigger 
                value="activity"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-1 py-3 text-sm text-neutral-500 cursor-pointer font-medium"
              >
                Activity
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="pt-6">
            <TabsContent value="overview" className="m-0 border-none outline-none">
              <WorkspaceOverviewTab candidate={candidate} application={activeApplication} />
            </TabsContent>
            
            <TabsContent value="timeline" className="m-0 border-none outline-none">
              <WorkspaceTimelineTab events={timeline} isLoading={isLoadingTimeline} />
            </TabsContent>

            <TabsContent value="documents" className="m-0 border-none outline-none">
              <WorkspaceDocumentsTab application={activeApplication} />
            </TabsContent>

            <TabsContent value="interview" className="m-0 border-none outline-none">
              <WorkspaceInterviewTab application={activeApplication} />
            </TabsContent>

            <TabsContent value="feedback" className="m-0 border-none outline-none">
              <WorkspaceFeedbackTab application={activeApplication} />
            </TabsContent>

            <TabsContent value="notes" className="m-0 border-none outline-none">
              <WorkspaceHRNotesTab application={activeApplication} />
            </TabsContent>

            <TabsContent value="offer" className="m-0 border-none outline-none">
              <WorkspaceOfferTab application={activeApplication} offer={offer} isLoading={isLoadingOffer} />
            </TabsContent>

            <TabsContent value="activity" className="m-0 border-none outline-none">
              <WorkspaceActivityTab activity={activity} isLoading={isLoadingActivity} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default CandidateProfile;

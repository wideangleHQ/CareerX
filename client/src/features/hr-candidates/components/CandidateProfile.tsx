'use client';

import React, { useState, memo } from 'react';
import { useCandidateWorkspace } from '../hooks/useCandidateWorkspace';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Phone, Mail, MessageCircle, FileSignature, CheckCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { useCandidateFiles, useFileAction } from '../hooks/useCandidateFiles';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { WorkspaceOverviewTab } from './WorkspaceTabs/WorkspaceOverviewTab';
import { WorkspaceTimelineTab } from './WorkspaceTabs/WorkspaceTimelineTab';
import { WorkspaceDocumentsTab } from './WorkspaceTabs/WorkspaceDocumentsTab';
import { WorkspaceResumeTab } from './WorkspaceTabs/WorkspaceResumeTab';
import { WorkspaceInterviewTab } from './WorkspaceTabs/WorkspaceInterviewTab';
import { WorkspaceFeedbackTab } from './WorkspaceTabs/WorkspaceFeedbackTab';
import { WorkspaceHRNotesTab } from './WorkspaceTabs/WorkspaceHRNotesTab';
import { WorkspaceOfferTab } from './WorkspaceTabs/WorkspaceOfferTab';
import { WorkspaceActivityTab } from './WorkspaceTabs/WorkspaceActivityTab';

interface CandidateProfileProps {
  candidateId: string;
  applicationId?: string;
}

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-neutral-100 text-neutral-700',
  SLOT_BOOKED: 'bg-amber-50 text-amber-700',
  INTERVIEWED: 'bg-purple-50 text-purple-700',
  SHORTLISTED: 'bg-teal-50 text-teal-700',
  SELECTED: 'bg-emerald-50 text-emerald-700',
  OFFER_RELEASED: 'bg-emerald-100 text-emerald-800',
  JOINED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-50 text-red-700',
  WITHDRAWN: 'bg-neutral-100 text-neutral-500',
};

const TAB_CLASS = 'data-[active]:bg-transparent data-[active]:shadow-none data-[active]:border-b-2 data-[active]:border-primary data-[active]:text-primary data-[selected]:bg-transparent data-[selected]:shadow-none data-[selected]:border-b-2 data-[selected]:border-primary data-[selected]:text-primary rounded-none px-1 py-3 text-[13px] text-neutral-500 cursor-pointer font-medium whitespace-nowrap';

interface ActionCardProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary';
}

const ActionCard = memo(function ActionCard({ icon, label, sublabel, onClick, disabled, variant = 'default' }: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex items-center gap-3 w-full rounded-lg border p-3 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        disabled && 'opacity-40 cursor-not-allowed',
        variant === 'primary'
          ? 'border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30'
          : 'border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300',
        !disabled && 'cursor-pointer',
      )}
    >
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
        variant === 'primary'
          ? 'bg-primary/10 text-primary group-hover:bg-primary/20'
          : 'bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200 group-hover:text-neutral-700',
      )}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn(
          'text-sm font-medium leading-tight',
          variant === 'primary' ? 'text-primary' : 'text-neutral-800',
        )}>{label}</p>
        {sublabel && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sublabel}</p>}
      </div>
      <ChevronRight className={cn(
        'h-4 w-4 shrink-0 transition-colors',
        variant === 'primary' ? 'text-primary/40' : 'text-neutral-300',
      )} />
    </button>
  );
});

export function CandidateProfile({ candidateId, applicationId }: CandidateProfileProps) {
  const {
    candidate,
    activeApplication,
    timeline,
    activity,
    offer,
    isLoading,
    isLoadingTimeline,
    isLoadingActivity,
    isLoadingOffer,
  } = useCandidateWorkspace(candidateId, applicationId);

  const [activeTab, setActiveTab] = useState('overview');

  const { files } = useCandidateFiles(activeApplication?.id);
  const fileAction = useFileAction();

  const resume = files.find((f) => f.fileType === 'RESUME') ?? null;
  const rawPhone = candidate?.mobileNumber?.trim() ?? '';
  const dialablePhone = rawPhone.replace(/[\s()-]/g, '');
  const hasPhone = /^\+?[1-9]\d{7,14}$/.test(dialablePhone);
  const email = candidate?.email?.trim() ?? '';
  const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleCall = () => {
    if (!hasPhone) { toast.error('No valid phone number on file for this candidate.'); return; }
    window.location.href = `tel:${dialablePhone}`;
  };

  const handleEmail = () => {
    if (!hasEmail) { toast.error('No valid email address on file for this candidate.'); return; }
    const subject = activeApplication?.applicationCode
      ? `Regarding your application ${activeApplication.applicationCode}`
      : 'Regarding your application';
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  };

  const handleDownloadResume = () => {
    if (!resume) { toast.error('No resume has been uploaded for this application.'); return; }
    fileAction.mutate({ file: resume, mode: 'download' });
  };

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

  const initials = candidate.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const statusStyle = STATUS_STYLES[activeApplication?.status ?? ''] ?? STATUS_STYLES.NEW;

  return (
    <div className="flex flex-col h-full">
      {/* ── Profile Header ── */}
      <div className="shrink-0 border-b border-neutral-200 bg-gradient-to-r from-emerald-50 via-green-50/60 to-white px-5 py-5 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-900 leading-tight truncate">
                {candidate.fullName}
              </h1>
              {activeApplication && (
                <Badge className={cn('text-[10px] font-bold tracking-wider border-0 shrink-0', statusStyle)}>
                  {activeApplication.status.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>

            {/* Contact info grid — no overlap */}
            <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-[auto_auto] gap-x-6 gap-y-0.5 text-[13px] text-neutral-600">
              {hasEmail && (
                <span className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span className="truncate">{email}</span>
                </span>
              )}
              {hasPhone && (
                <span className="flex items-center gap-1.5 truncate">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span className="truncate">{rawPhone}</span>
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
              <span>{activeApplication?.department?.name || 'No Department'}</span>
              {activeApplication?.opportunity?.title && (
                <>
                  <span className="text-neutral-300">&middot;</span>
                  <span className="truncate">{activeApplication.opportunity.title}</span>
                </>
              )}
              <span className="text-neutral-300">&middot;</span>
              <span className="font-mono text-[11px]">{activeApplication?.applicationCode || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + tabs ── */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar — sticky on desktop, collapses on mobile */}
        <aside className="w-full lg:w-[240px] xl:w-[260px] shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-200 bg-neutral-50/40 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-2 lg:sticky lg:top-0">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-1 mb-3">Quick Actions</p>
            <ActionCard
              icon={<Download className="h-4 w-4" />}
              label="Download Resume"
              sublabel={resume?.fileName}
              onClick={handleDownloadResume}
              disabled={!resume || fileAction.isPending}
            />
            <ActionCard
              icon={<Phone className="h-4 w-4" />}
              label="Call Candidate"
              sublabel={hasPhone ? rawPhone : 'No phone'}
              onClick={handleCall}
              disabled={!hasPhone}
            />
            <ActionCard
              icon={<Mail className="h-4 w-4" />}
              label="Email Candidate"
              sublabel={hasEmail ? email : 'No email'}
              onClick={handleEmail}
              disabled={!hasEmail}
            />
            <ActionCard
              icon={<MessageCircle className="h-4 w-4" />}
              label="Add HR Note"
              onClick={() => setActiveTab('notes')}
            />

            <div className="pt-2 space-y-2">
              <ActionCard
                icon={<CheckCircle className="h-4 w-4" />}
                label="Update Status"
                variant="primary"
                onClick={() => {}}
              />
              {activeApplication?.status === 'SELECTED' && (
                <ActionCard
                  icon={<FileSignature className="h-4 w-4" />}
                  label="Generate Offer"
                  variant="primary"
                  onClick={() => setActiveTab('offer')}
                />
              )}
            </div>

            {/* Assigned HR info */}
            {activeApplication?.assignedHr && (
              <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Assigned HR</p>
                <p className="text-sm font-medium text-neutral-800 truncate">{activeApplication.assignedHr.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{activeApplication.assignedHr.email}</p>
              </div>
            )}
          </div>
        </aside>

        {/* Right content — tabs */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            {/* Sticky tab bar */}
            <div className="shrink-0 sticky top-0 z-10 bg-white border-b border-neutral-200">
              <div className="overflow-x-auto custom-scrollbar">
                <TabsList className="bg-transparent rounded-none w-full justify-start h-11 p-0 px-5 space-x-5 min-w-max">
                  <TabsTrigger value="overview" className={TAB_CLASS}>Overview</TabsTrigger>
                  <TabsTrigger value="resume" className={TAB_CLASS}>Resume</TabsTrigger>
                  <TabsTrigger value="timeline" className={TAB_CLASS}>Timeline</TabsTrigger>
                  <TabsTrigger value="documents" className={TAB_CLASS}>Documents</TabsTrigger>
                  <TabsTrigger value="interview" className={TAB_CLASS}>Interview</TabsTrigger>
                  <TabsTrigger value="feedback" className={TAB_CLASS}>Feedback</TabsTrigger>
                  <TabsTrigger value="notes" className={TAB_CLASS}>HR Notes</TabsTrigger>
                  <TabsTrigger value="offer" className={TAB_CLASS}>Offer</TabsTrigger>
                  <TabsTrigger value="activity" className={TAB_CLASS}>Activity</TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Tab panels — scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-5">
                <TabsContent value="overview" className="m-0 border-none outline-none">
                  <WorkspaceOverviewTab candidate={candidate} application={activeApplication} />
                </TabsContent>
                <TabsContent value="resume" className="m-0 border-none outline-none">
                  <WorkspaceResumeTab application={activeApplication} />
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
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default CandidateProfile;

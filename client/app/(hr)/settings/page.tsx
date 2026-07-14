'use client';

import React, { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings, Shield, User, Info, Mail, Building2, Calendar, Lock } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Hardcoded email template previews
  const emailTemplates = [
    { id: 'app_received', name: 'Application Received', subject: 'We received your application!', preview: 'Hi {{candidate_name}},\n\nThank you for applying for the {{job_title}} role at CareerX. Our team is reviewing your profile and will get back to you shortly.\n\nBest,\nTalent Acquisition Team' },
    { id: 'int_scheduled', name: 'Interview Scheduled', subject: 'Your interview is confirmed', preview: 'Hi {{candidate_name}},\n\nYour interview for {{job_title}} has been scheduled on {{date}} at {{time}} via {{meeting_link}}.\n\nBest,\nHR Team' },
    { id: 'int_reminder', name: 'Interview Reminder', subject: 'Reminder: Interview tomorrow', preview: 'Hi {{candidate_name}},\n\nJust a quick reminder about your interview tomorrow at {{time}}.\n\nLooking forward to speaking with you!' },
    { id: 'offer_released', name: 'Offer Released', subject: 'Congratulations! Job Offer from CareerX', preview: 'Hi {{candidate_name}},\n\nWe are thrilled to extend an offer for the {{job_title}} position. Please find the details attached.\n\nWelcome aboard!' },
    { id: 'rejected', name: 'Application Update (Rejected)', subject: 'Update on your application', preview: 'Hi {{candidate_name}},\n\nThank you for your time. Unfortunately, we will not be moving forward with your application at this time.\n\nWe wish you the best in your career search.' },
    { id: 'selected', name: 'Application Selected', subject: 'Great news!', preview: 'Hi {{candidate_name}},\n\nWe are excited to inform you that you have been selected for the next stage of our interview process. We will reach out shortly with scheduling details.' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-black flex items-center gap-2">
          <Settings className="h-6 w-6 text-neutral-500" /> System Settings
        </h1>
        <p className="text-xs text-muted-foreground">Manage workspace configurations, email templates, and access privileges.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <TabsList className="bg-neutral-100/50 p-1 mb-4 h-auto inline-flex">
            <TabsTrigger value="profile" className="cursor-pointer text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Profile</TabsTrigger>
            <TabsTrigger value="security" className="cursor-pointer text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Security & Permissions</TabsTrigger>
            <TabsTrigger value="email" className="cursor-pointer text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Email Templates</TabsTrigger>
            <TabsTrigger value="general" className="cursor-pointer text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Company & General</TabsTrigger>
            <TabsTrigger value="interview" className="cursor-pointer text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Interview Config</TabsTrigger>
            <TabsTrigger value="departments" className="cursor-pointer text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Departments</TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="border-neutral-200 shadow-none">
                <CardHeader className="bg-neutral-50/20 border-b p-6">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <User className="h-4.5 w-4.5 text-neutral-500" /> User Identity Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered Email</p>
                      <p className="font-medium text-black mt-1">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User UUID ID</p>
                      <p className="font-mono text-xs text-neutral-700 mt-1">{user?.sub}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Department ID</p>
                    <p className="font-mono text-xs text-neutral-700 mt-1">
                      {user?.departmentId || 'All-Departments Scope (Admin/Cross-department)'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="border-neutral-200 shadow-none">
                <CardHeader className="bg-neutral-50/20 border-b p-6">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Info className="h-4.5 w-4.5 text-neutral-500" /> Session Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4 text-xs text-neutral-600">
                  <div>
                    <p className="font-semibold text-black">Current Session</p>
                    <p className="mt-0.5">Active (Secure HTTP-Only Cookie)</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-black">Role</p>
                    <p className="mt-0.5 capitalize">HR User</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Security & Permissions Tab */}
        <TabsContent value="security" className="mt-0 space-y-6">
          <Card className="border-neutral-200 shadow-none">
            <CardHeader className="bg-neutral-50/20 border-b p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-neutral-500" /> Security Access Claims
              </CardTitle>
              <CardDescription>Permissions and roles assigned to your account.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <p className="text-sm text-neutral-600">
                Your role carries the following verified authorization claims:
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {user?.permissions?.map((permission) => (
                  <Badge
                    key={permission}
                    variant="outline"
                    className="text-xs px-2.5 py-1 bg-green-50 text-green-700 border-green-200"
                  >
                    {permission}
                  </Badge>
                )) || <p className="text-sm text-neutral-500 italic">No permissions declared.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 shadow-none">
            <CardHeader className="bg-neutral-50/20 border-b p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 text-neutral-500" /> Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-neutral-600 mb-4">You can update your password here. You will be required to sign in again after changing it.</p>
              <Button variant="outline" className="cursor-pointer">Request Password Reset</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="email" className="mt-0">
          <Card className="border-neutral-200 shadow-none">
            <CardHeader className="bg-neutral-50/20 border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Mail className="h-4.5 w-4.5 text-neutral-500" /> Email Templates (Preview)
                  </CardTitle>
                  <CardDescription className="mt-1">System generated emails sent to candidates. Editor is locked pending backend implementation.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
                {emailTemplates.map((template) => (
                  <div key={template.id} className="p-6 hover:bg-neutral-50/50 transition-colors border-b border-neutral-100">
                    <h4 className="font-bold text-neutral-900 mb-1">{template.name}</h4>
                    <p className="text-xs text-neutral-500 mb-4 font-mono">Subject: {template.subject}</p>
                    <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm relative">
                      <div className="absolute top-2 right-2 flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                      </div>
                      <pre className="text-xs text-neutral-700 whitespace-pre-wrap font-sans mt-2">
                        {template.preview}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General & Company Tab */}
        <TabsContent value="general" className="mt-0 space-y-6">
          <Card className="border-neutral-200 shadow-none">
            <CardHeader className="bg-neutral-50/20 border-b p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-neutral-500" /> Company Profile
              </CardTitle>
              <CardDescription>Global workspace settings.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 max-w-md">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase">Company Name</p>
                  <p className="text-sm font-medium mt-1">CareerX Technologies</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase">Timezone</p>
                  <p className="text-sm font-medium mt-1">UTC / Universal Coordinated Time</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase">Brand Color</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded bg-primary border"></div>
                    <p className="text-sm font-mono text-neutral-600">#000000 (Primary)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interview Config Tab */}
        <TabsContent value="interview" className="mt-0 space-y-6">
          <Card className="border-neutral-200 shadow-none">
            <CardHeader className="bg-neutral-50/20 border-b p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-neutral-500" /> Interview Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-neutral-600 mb-4">Default settings for slot generation and calendar integration.</p>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between border-b pb-2">
                  <span className="text-neutral-500">Default Slot Duration</span>
                  <span className="font-semibold text-neutral-900">45 Minutes</span>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span className="text-neutral-500">Buffer Between Interviews</span>
                  <span className="font-semibold text-neutral-900">15 Minutes</span>
                </li>
                <li className="flex justify-between pb-2">
                  <span className="text-neutral-500">Video Integration</span>
                  <span className="font-semibold text-neutral-900">Zoom / Microsoft Teams (System Default)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="mt-0 space-y-6">
          <Card className="border-neutral-200 shadow-none">
            <CardHeader className="bg-neutral-50/20 border-b p-6">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-neutral-500" /> Departments Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-neutral-600 mb-4">
                Departments are managed through the central Departments module.
              </p>
              <Button variant="outline" className="cursor-pointer" onClick={() => window.location.href = '/departments'}>
                Go to Departments Module
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


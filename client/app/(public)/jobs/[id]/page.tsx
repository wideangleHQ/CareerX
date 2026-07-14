'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { opportunitiesApi } from '@/src/api/opportunities';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Briefcase, Clock, GraduationCap, CheckCircle2, Loader2, DollarSign } from 'lucide-react';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => opportunitiesApi.findOne(id),
    enabled: !!id,
  });

  const job = res?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Job Not Found</h2>
        <p className="text-neutral-500 mb-6">The position you're looking for doesn't exist or is no longer available.</p>
        <Button onClick={() => router.push('/jobs')} variant="outline" className="cursor-pointer">
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 pt-16 pb-12 px-6">
        <div className="mx-auto max-w-4xl">
          <Link href="/jobs" className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to open positions
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mb-4 leading-tight">
                {job.public_title || job.internal_position}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-neutral-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-neutral-400" /> {job.department?.name || 'General'}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-neutral-400" /> {job.location || 'Flexible Location'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-neutral-400" /> {job.hiring_type?.replace('_', ' ')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-none shadow-none text-[10px] uppercase tracking-wider font-bold">
                    {job.work_mode?.replace('_', ' ')}
                  </Badge>
                </span>
              </div>
            </div>
            <div className="shrink-0">
              <Link href={`/apply?opportunityId=${job.id}`}>
                <Button size="lg" className="w-full md:w-auto cursor-pointer rounded-full px-8 text-base font-semibold shadow-sm">
                  Apply for this position
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          
          {job.about && (
            <section>
              <h2 className="text-xl font-bold text-neutral-900 mb-4">About the role</h2>
              <div className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {job.about}
              </div>
            </section>
          )}

          {job.responsibilities && (
            <section>
              <h2 className="text-xl font-bold text-neutral-900 mb-4">What you'll do</h2>
              <div className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {job.responsibilities}
              </div>
            </section>
          )}

          {job.preferred_languages && job.preferred_languages.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Skills & Languages</h2>
              <div className="flex flex-wrap gap-2">
                {job.preferred_languages.map(lang => (
                  <span key={lang} className="px-3 py-1 bg-white border border-neutral-200 rounded-full text-sm font-medium text-neutral-700">
                    {lang}
                  </span>
                ))}
              </div>
            </section>
          )}

          {job.benefits && (
            <section>
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Benefits & Perks</h2>
              <div className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {job.benefits}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h3 className="font-bold text-neutral-900 mb-4">Role Overview</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <Briefcase className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Career Level</p>
                  <p className="text-sm font-medium text-neutral-900 mt-0.5">{job.career_level?.replace('_', ' ')}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Experience</p>
                  <p className="text-sm font-medium text-neutral-900 mt-0.5">
                    {job.min_experience_years} - {job.max_experience_years || 'No limit'} years
                  </p>
                </div>
              </li>
              {job.educational_qualification && (
                <li className="flex gap-3">
                  <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Education</p>
                    <p className="text-sm font-medium text-neutral-900 mt-0.5">{job.educational_qualification}</p>
                  </div>
                </li>
              )}
              {(job.min_salary || job.max_salary) && (
                <li className="flex gap-3">
                  <DollarSign className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Salary Range</p>
                    <p className="text-sm font-medium text-neutral-900 mt-0.5">
                      {job.min_salary ? `$${job.min_salary.toLocaleString()}` : ''}
                      {job.min_salary && job.max_salary ? ' - ' : ''}
                      {job.max_salary ? `$${job.max_salary.toLocaleString()}` : (job.min_salary ? '+' : 'Undisclosed')}
                    </p>
                  </div>
                </li>
              )}
            </ul>
            
            <div className="mt-8 pt-6 border-t border-neutral-100">
              <Link href={`/apply?opportunityId=${job.id}`}>
                <Button className="w-full cursor-pointer rounded-full font-semibold">Apply Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

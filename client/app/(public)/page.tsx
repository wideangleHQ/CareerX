'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  ArrowRight,
  X,
  SlidersHorizontal,
  ChevronDown,
  Building,
  GraduationCap,
  Calendar,
  Sparkles,
  TrendingUp,
  BookOpen,
  Users,
  Compass,
  Cpu,
  Heart,
  ChevronRight,
  HelpCircle,
  Zap,
  Building2,
  Award
} from 'lucide-react';
import { useDebounce } from '@/src/features/candidate-portal/hooks/useDebounce';
import { departmentsApi } from '@/src/api/departments';
import { opportunitiesApi } from '@/src/api/opportunities';

export default function LandingPage() {
  // State for search and filters
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [careerLevel, setCareerLevel] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [location, setLocation] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const jobsSectionRef = useRef<HTMLDivElement>(null);
  const whyJoinRef = useRef<HTMLDivElement>(null);

  // Fetch all jobs for metadata extraction (locations, departments)
  const { data: allJobsRes } = useQuery({
    queryKey: ['all-public-opportunities'],
    queryFn: () => opportunitiesApi.findPublic(),
  });
  const allJobs = allJobsRes?.data ?? [];

  // Fetch filtered jobs
  const { data: jobsRes, isLoading } = useQuery({
    queryKey: [
      'public-opportunities',
      debouncedSearch,
      departmentId,
      careerLevel,
      employmentType,
      workMode,
      location,
    ],
    queryFn: () =>
      opportunitiesApi.findPublic({
        search: debouncedSearch || undefined,
        departmentId: departmentId || undefined,
        careerLevel: careerLevel || undefined,
        employmentType: employmentType || undefined,
        workMode: workMode || undefined,
        location: location || undefined,
      }),
  });
  const jobs = jobsRes?.data ?? [];

  // Extract unique departments dynamically from all jobs
  const departments = useMemo(() => {
    const map = new Map();
    allJobs.forEach((job: any) => {
      if (job.departmentId && job.departmentName) {
        map.set(job.departmentId, job.departmentName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allJobs]);

  // Extract unique locations dynamically from all jobs
  const locations = useMemo(() => {
    const set = new Set<string>();
    allJobs.forEach((job: any) => {
      if (job.location) set.add(job.location);
    });
    return Array.from(set);
  }, [allJobs]);

  // Scroll helpers
  const scrollToJobs = () => {
    jobsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToWhyJoin = () => {
    whyJoinRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearFilters = () => {
    setSearch('');
    setDepartmentId('');
    setCareerLevel('');
    setEmploymentType('');
    setWorkMode('');
    setLocation('');
  };

  const hasActiveFilters =
    search || departmentId || careerLevel || employmentType || workMode || location;

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50 flex flex-col font-sans antialiased selection:bg-primary selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative w-full py-20 md:py-32 bg-neutral-950 text-white overflow-hidden border-b border-neutral-900">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
        
        {/* Top-right soft gradient circle */}
        <div className="absolute right-[-10%] top-[-10%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        {/* Bottom-left soft gradient circle */}
        <div className="absolute left-[-10%] bottom-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-900/10 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10 grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 space-y-6 text-left">
            <Badge className="bg-primary/20 text-emerald-400 border border-primary/30 rounded-full px-4 py-1 font-semibold uppercase tracking-wider text-xs pointer-events-none hover:bg-primary/20">
              Careers at Ruchi
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Build Your Career <br />
              <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                With Ruchi
              </span>
            </h1>
            <p className="text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed">
              We build next-generation talent management systems. Join our team of remote-first innovators, builders, and creators, where we design technology that connects talent to global opportunities.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Button
                onClick={scrollToJobs}
                className="bg-primary hover:bg-emerald-700 text-white rounded-full px-8 py-6 text-base font-semibold cursor-pointer transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center shadow-lg shadow-primary/20"
              >
                View Open Roles <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={scrollToWhyJoin}
                variant="outline"
                className="border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-full px-8 py-6 text-base font-semibold cursor-pointer transition-all"
              >
                Learn About Us
              </Button>
            </div>
          </div>

          {/* Floating UI Graphics */}
          <div className="md:col-span-5 hidden md:flex relative justify-center items-center h-[400px]">
            {/* Visual Glass Box 1 */}
            <div className="absolute top-[10%] left-[5%] p-6 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-md shadow-2xl transition-all duration-500 hover:translate-y-[-5px]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Hiring Rate</div>
                  <div className="font-bold text-lg text-white">+48% Year Over Year</div>
                </div>
              </div>
            </div>

            {/* Visual Glass Box 2 */}
            <div className="absolute bottom-[15%] right-[5%] p-6 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-md shadow-2xl transition-all duration-500 hover:translate-y-[5px]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-primary/20 text-primary-foreground">
                  <Briefcase className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Current Openings</div>
                  <div className="font-bold text-lg text-white">{allJobs.length} Active Positions</div>
                </div>
              </div>
            </div>

            {/* Visual Center Circle Decorative */}
            <div className="w-64 h-64 rounded-full border border-neutral-800 flex items-center justify-center relative">
              <div className="w-48 h-48 rounded-full border border-dashed border-neutral-700 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-950 blur-sm opacity-60 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. JOB SEARCH & FILTER SECTION */}
      <section ref={jobsSectionRef} className="relative w-full py-16 px-6 md:px-8 max-w-7xl mx-auto scroll-mt-16">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">Find Your Perfect Role</h2>
          <p className="text-sm text-neutral-500 mt-1">Discover opportunities that align with your experience and aspirations.</p>
        </div>

        {/* Large Search Bar */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 md:p-6 shadow-sm mb-6">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-neutral-400" />
            <Input
              placeholder="Search by job title, skill, keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 text-base border-neutral-200 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary shadow-xs"
              aria-label="Search jobs"
            />
          </div>

          {/* 3. FILTER SECTION - Horizontal Filter Panel */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Department Select */}
            <div className="relative">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700 outline-none focus:border-primary transition-colors cursor-pointer appearance-none"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 bottom-3.5 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Career Level Select */}
            <div className="relative">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Career Level</label>
              <select
                value={careerLevel}
                onChange={(e) => setCareerLevel(e.target.value)}
                className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700 outline-none focus:border-primary transition-colors cursor-pointer appearance-none"
              >
                <option value="">All Levels</option>
                <option value="ENTRY_LEVEL">Entry Level</option>
                <option value="JUNIOR">Junior</option>
                <option value="MID_LEVEL">Mid Level</option>
                <option value="SENIOR">Senior</option>
                <option value="LEAD">Lead</option>
                <option value="MANAGER">Manager</option>
                <option value="DIRECTOR">Director</option>
                <option value="EXECUTIVE">Executive</option>
              </select>
              <ChevronDown className="absolute right-3 bottom-3.5 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Employment Type Select */}
            <div className="relative">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700 outline-none focus:border-primary transition-colors cursor-pointer appearance-none"
              >
                <option value="">All Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
              <ChevronDown className="absolute right-3 bottom-3.5 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Work Mode Select */}
            <div className="relative">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Work Mode</label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700 outline-none focus:border-primary transition-colors cursor-pointer appearance-none"
              >
                <option value="">All Work Modes</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ON_SITE">On-site</option>
              </select>
              <ChevronDown className="absolute right-3 bottom-3.5 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Location Select */}
            <div className="relative">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700 outline-none focus:border-primary transition-colors cursor-pointer appearance-none"
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 bottom-3.5 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* Active Filter Chips and Clear Button */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-neutral-100">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-neutral-500 font-medium">Active Filters:</span>
                
                {search && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-emerald-50 text-primary border-emerald-100">
                    Query: "{search}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearch('')} />
                  </Badge>
                )}

                {departmentId && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-emerald-50 text-primary border-emerald-100">
                    {departments.find((d) => d.id === departmentId)?.name || 'Department'}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setDepartmentId('')} />
                  </Badge>
                )}

                {careerLevel && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-emerald-50 text-primary border-emerald-100">
                    {careerLevel.replace('_', ' ')}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setCareerLevel('')} />
                  </Badge>
                )}

                {employmentType && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-emerald-50 text-primary border-emerald-100">
                    {employmentType.replace('_', ' ')}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setEmploymentType('')} />
                  </Badge>
                )}

                {workMode && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-emerald-50 text-primary border-emerald-100">
                    {workMode.replace('_', ' ')}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setWorkMode('')} />
                  </Badge>
                )}

                {location && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-emerald-50 text-primary border-emerald-100">
                    {location}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setLocation('')} />
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-neutral-500 hover:text-primary text-xs font-semibold cursor-pointer h-8"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>

        {/* 4. FEATURED JOB CARDS */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="h-6 w-1/2 bg-neutral-200 rounded" />
                  <div className="h-5 w-16 bg-neutral-200 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-neutral-100 rounded" />
                  <div className="h-4 w-2/3 bg-neutral-100 rounded" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-8 w-20 bg-neutral-100 rounded-full" />
                  <div className="h-8 w-20 bg-neutral-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-neutral-200 shadow-sm max-w-md mx-auto">
            <HelpCircle className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-800">No Positions Found</h3>
            <p className="text-neutral-500 text-sm mt-1 mb-6">
              We couldn't find any opportunities matching your selected criteria.
            </p>
            <Button onClick={clearFilters} className="bg-primary hover:bg-emerald-700 text-white rounded-full cursor-pointer">
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {jobs.map((job: any) => {
              // Mark urgent if priority is high or critical
              const isUrgent = job.hiringPriority === 'HIGH' || job.hiringPriority === 'URGENT';

              return (
                <div
                  key={job.opportunityId}
                  className="group bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-emerald-500/20 hover:bg-neutral-50/20 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Badges / Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        {job.departmentName || 'General'}
                      </span>
                      <div className="flex gap-2">
                        {isUrgent && (
                          <Badge className="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold uppercase rounded-full shadow-none">
                            Urgent
                          </Badge>
                        )}
                        <Badge className="bg-emerald-50 text-primary border border-emerald-100 text-[10px] font-bold uppercase rounded-full shadow-none">
                          Hiring
                        </Badge>
                      </div>
                    </div>

                    {/* Job Title */}
                    <h3 className="text-xl font-bold text-neutral-900 group-hover:text-primary transition-colors mb-2">
                      <Link href={`/jobs/${job.opportunityId}`}>
                        {job.name}
                      </Link>
                    </h3>

                    {/* Job Summary Description */}
                    <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed mb-5">
                      {job.shortDescription || 'Learn more about this position and apply today.'}
                    </p>

                    {/* Meta info tags */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-neutral-500 mb-6">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-neutral-400" /> {job.location || 'HQ'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" /> {job.employmentType?.replace('_', ' ') || 'Full Time'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-neutral-400" /> {job.workMode?.replace('_', ' ')}
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5 text-neutral-400" /> {job.experienceRange}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-auto">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(job.publishedAt)}
                    </span>
                    <div className="flex items-center gap-3">
                      <Link href={`/jobs/${job.opportunityId}`}>
                        <Button variant="ghost" size="sm" className="font-semibold text-neutral-600 hover:text-black rounded-lg cursor-pointer">
                          Details
                        </Button>
                      </Link>
                      <Link href={`/apply?opportunityId=${job.opportunityId}`}>
                        <Button size="sm" className="bg-primary hover:bg-emerald-700 text-white rounded-full font-semibold cursor-pointer">
                          Apply Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. WHY JOIN RUCHI SECTION */}
      <section ref={whyJoinRef} className="w-full bg-neutral-900 py-24 text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full px-4 py-1 mb-4 font-semibold uppercase tracking-wider text-xs pointer-events-none">
              Life at Ruchi
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Why Join Our Team?</h2>
            <p className="text-neutral-400 mt-3 text-base md:text-lg">
              We invest in professional alignment, employee well-being, and structured career growth.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Career Growth',
                icon: TrendingUp,
                desc: 'Accelerated development tracks, mentoring programs, and direct exposure to leadership.',
              },
              {
                title: 'Continuous Learning',
                icon: BookOpen,
                desc: 'Dedicated budget for resources, certifications, conferences, and formal courses.',
              },
              {
                title: 'Innovation Culture',
                icon: Cpu,
                desc: 'Empowerment to own processes, ship clean software, and implement scalable architectures.',
              },
              {
                title: 'Supportive Culture',
                icon: Users,
                desc: 'Inclusive team environments built on mutual trust, clear feedback, and transparency.',
              },
              {
                title: 'Transparent Leadership',
                icon: Compass,
                desc: 'Open communication channels and direct impact on organizational decision-making.',
              },
              {
                title: 'Work-Life Balance',
                icon: Heart,
                desc: 'Structured remote setups, flexible schedules, and respect for asynchronous work-blocks.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-emerald-800 hover:bg-neutral-950/80 transition-all duration-300 flex flex-col items-start text-left"
              >
                <div className="p-3.5 rounded-xl bg-neutral-900 group-hover:bg-primary/20 group-hover:text-emerald-400 text-neutral-400 mb-5 transition-colors">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HIRING PROCESS SECTION */}
      <section className="w-full bg-white py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
          <div className="max-w-2xl mx-auto mb-16">
            <Badge className="bg-emerald-50 text-primary border border-emerald-100 rounded-full px-4 py-1 mb-4 font-semibold uppercase tracking-wider text-xs pointer-events-none">
              Workflow
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900">Our Hiring Process</h2>
            <p className="text-neutral-500 mt-3 text-sm md:text-base">
              A transparent, straightforward candidate experience designed to value your time.
            </p>
          </div>

          {/* Minimal visual timeline */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 relative max-w-5xl mx-auto">
            {/* Background line for desktop */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-neutral-100 -translate-y-1/2 hidden md:block z-0" />
            
            {[
              { step: '1', title: 'Apply', desc: 'Submit resume & basic details' },
              { step: '2', title: 'Review', desc: 'Our recruiters assess qualifications' },
              { step: '3', title: 'Interview', desc: 'Book interactive calls with team' },
              { step: '4', title: 'Offer', desc: 'Align on goals, package & path' },
              { step: '5', title: 'Join', desc: 'Welcome session & onboarding' },
            ].map((p, index) => (
              <div key={index} className="relative z-10 flex flex-col items-center group">
                <div className="h-12 w-12 rounded-full bg-neutral-50 group-hover:bg-emerald-50 border-2 border-neutral-200 group-hover:border-primary text-neutral-600 group-hover:text-primary font-bold flex items-center justify-center transition-all duration-300 text-sm mb-4">
                  {p.step}
                </div>
                <h3 className="text-base font-bold text-neutral-900 mb-1">{p.title}</h3>
                <p className="text-xs text-neutral-500 max-w-[150px] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. COMPANY VALUES SECTION */}
      <section className="w-full bg-neutral-50 py-24 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-neutral-900">Our Core Principles</h2>
            <p className="text-neutral-500 mt-2 text-sm">What guides our product engineering and organizational behavior.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Our Mission',
                desc: 'To streamline recruitment workflows internationally, building reliable software pipelines that support automated talent tracking and booking.',
                tag: 'Mission'
              },
              {
                title: 'Our Vision',
                desc: 'A frictionless ecosystem where technical capabilities and career opportunities align seamlessly without geographical barriers.',
                tag: 'Vision'
              },
              {
                title: 'Our Culture',
                desc: 'Continuous feedback, direct communication, asynchronous flexibility, and absolute transparency in organizational goal setting.',
                tag: 'Culture'
              }
            ].map((v, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-8 text-left shadow-xs">
                <Badge className="bg-neutral-100 text-neutral-700 hover:bg-neutral-100 shadow-none font-semibold text-[10px] uppercase rounded-full mb-4">
                  {v.tag}
                </Badge>
                <h3 className="text-lg font-bold text-neutral-900 mb-3">{v.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. EMPLOYEE BENEFITS SECTION */}
      <section className="w-full bg-white py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-neutral-900">Perks & Compensation</h2>
            <p className="text-neutral-500 mt-2 text-sm">Comprehensive benefits designed for personal and professional stability.</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { title: 'Global Health Care', desc: 'Premium coverage including medical, dental, and vision support.' },
              { title: 'Learning Stipend', desc: 'Annual cash stipend for books, online courses, and developer certs.' },
              { title: 'Milestone Rewards', desc: 'Recognition bonuses, stock rewards, and continuous performance incentives.' },
              { title: 'Career Alignment', desc: 'Scheduled reviews twice a year with transparent advancement metrics.' },
              { title: 'Flexible Work', desc: 'Remote setup support, home office allowance, and work-hours flexibility.' }
            ].map((benefit, i) => (
              <div key={i} className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6 text-left flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 text-primary flex items-center justify-center mb-4">
                    <Award className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 mb-2">{benefit.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ SECTION (Accordion) */}
      <section className="w-full bg-neutral-50 py-24 border-t border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-neutral-900">Frequently Asked Questions</h2>
            <p className="text-neutral-500 mt-2 text-sm">Common questions regarding application stages and recruitment timelines.</p>
          </div>

          <Accordion type="single" className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How long does the application review process take?</AccordionTrigger>
              <AccordionContent>
                Our recruitment team reviews every candidate file within 3 to 5 business days. You will receive an status email notification as soon as your application is processed.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I apply for multiple open positions?</AccordionTrigger>
              <AccordionContent>
                Yes, you may submit multiple applications. However, we advise aligning on roles that match your background best.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>What is the structure of the interview process?</AccordionTrigger>
              <AccordionContent>
                Typically, it consists of: 1) Initial discovery call (Recruiting), 2) Interactive technical evaluation, and 3) Alignment review with engineering management.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Are all roles remote-first?</AccordionTrigger>
              <AccordionContent>
                We support remote work blocks. Select roles can be hybrid or onsite depending on operations, which is clearly marked on each individual position card.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* 10. FINAL CTA SECTION */}
      <section className="w-full bg-white py-24 px-6 md:px-8">
        <div className="max-w-5xl mx-auto rounded-3xl bg-neutral-950 border border-neutral-900 p-8 md:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute right-[-10%] top-[-10%] w-[300px] h-[300px] rounded-full bg-primary/20 blur-[80px]" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Ready to Make an Impact?</h2>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              Explore our vacancies, submit your professional profile, and help build the future of Recruiter Workspaces.
            </p>
            <div className="pt-4 flex justify-center">
              <Button
                onClick={scrollToJobs}
                className="bg-primary hover:bg-emerald-700 text-white rounded-full px-8 py-6 text-base font-semibold cursor-pointer shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                Find Your Role <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-12 px-6 bg-neutral-950 border-t border-neutral-950 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>&copy; {new Date().getFullYear()} Ruchi CareerX Workspace. All rights reserved.</div>
          <div className="flex gap-4">
            <span className="hover:text-neutral-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-neutral-300 cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


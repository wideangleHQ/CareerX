'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Building2, Users, Briefcase, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-32 lg:px-8 bg-neutral-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-neutral-200/50 bg-[length:16px_16px]" />
        <div className="relative mx-auto max-w-5xl text-center z-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-6xl">
            Build your career with us.
          </h1>
          <p className="mt-6 text-lg leading-8 text-neutral-600 max-w-2xl mx-auto">
            Discover opportunities to grow, innovate, and make an impact. Join our team of passionate builders and creators solving the world's most complex problems.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/jobs">
              <Button size="lg" className="rounded-full px-8 cursor-pointer h-12 text-base font-semibold">
                View Open Positions <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-24 px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900">Why join our team?</h2>
            <p className="mt-4 text-neutral-600">We invest in our people so they can do their best work.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Remote-First Culture', icon: Zap, desc: 'Work from anywhere with flexible hours and supportive remote policies.' },
              { title: 'Health & Wellness', icon: CheckCircle2, desc: 'Comprehensive medical, dental, and vision coverage for you and your family.' },
              { title: 'Continuous Learning', icon: Users, desc: 'Annual stipend for courses, conferences, and books to accelerate your growth.' },
            ].map((benefit, i) => (
              <div key={i} className="p-6 rounded-2xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-24 px-6 lg:px-8 bg-neutral-900 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold mb-12">Departments Hiring</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'Customer Success', 'Operations', 'HR'].map((dept) => (
              <Link key={dept} href={`/jobs?department=${dept.toLowerCase()}`}>
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-800/50 hover:bg-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex flex-col items-center gap-3">
                  <Building2 className="h-6 w-6 text-neutral-400" />
                  <span className="font-semibold text-sm">{dept}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring Process */}
      <section className="py-24 px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-neutral-900 mb-16">Our Hiring Process</h2>
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
            {[
              { step: 1, title: 'Apply', desc: 'Submit your application through our portal.' },
              { step: 2, title: 'Review', desc: 'Our team reviews your profile and experience.' },
              { step: 3, title: 'Interviews', desc: 'Meet with the team through video calls.' },
              { step: 4, title: 'Offer', desc: 'Receive your offer and join the team!' },
            ].map((process, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-primary text-white font-bold text-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  {process.step}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl border border-neutral-100 bg-white shadow-sm">
                  <h3 className="text-lg font-bold text-neutral-900 mb-1">{process.title}</h3>
                  <p className="text-sm text-neutral-600">{process.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 lg:px-8 bg-neutral-50 text-center border-t border-neutral-200">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-neutral-900 mb-6">Ready to make an impact?</h2>
          <Link href="/jobs">
            <Button size="lg" className="rounded-full px-8 cursor-pointer h-12 text-base font-semibold">
              <Briefcase className="mr-2 h-4 w-4" /> Explore Opportunities
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-neutral-500 border-t border-neutral-100">
        &copy; {new Date().getFullYear()} CareerX. All rights reserved.
      </footer>
    </div>
  );
}

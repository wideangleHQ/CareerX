'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { candidatesApi } from '@/src/api/candidates';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Eye, Users } from 'lucide-react';
import Link from 'next/link';

export default function CandidatesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const { data: response, isLoading } = useQuery({
    queryKey: ['candidates', search, page, limit],
    queryFn: () =>
      candidatesApi.findAll({
        search: search || undefined,
        page,
        limit,
      }),
  });

  const candidates = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-black flex items-center gap-2">
          <Users className="h-6 w-6 text-neutral-500" /> Candidates Directory
        </h1>
        <p className="text-xs text-muted-foreground">
          View candidate credentials, application history, and notes.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="relative max-w-xs bg-white border rounded-lg shadow-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search candidates by name, email..."
          className="pl-9 h-9"
        />
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-10 w-10 text-neutral-300" />
            <h3 className="text-base font-bold text-black mt-3">No candidates found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              No profiles match your criteria.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate Name</TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Registered Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((cand) => (
                  <TableRow key={cand.id}>
                    <TableCell className="font-semibold text-black">
                      {cand.full_name}
                    </TableCell>
                    <TableCell className="text-neutral-600">{cand.email}</TableCell>
                    <TableCell className="text-neutral-600">{cand.mobile_number}</TableCell>
                    <TableCell className="text-xs text-neutral-500">
                      {new Date(cand.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/candidates/${cand.id}`}>
                        <Button variant="outline" size="xs" className="cursor-pointer">
                          <Eye className="mr-1 h-3.5 w-3.5" /> Profile
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>
    </div>
  );
}

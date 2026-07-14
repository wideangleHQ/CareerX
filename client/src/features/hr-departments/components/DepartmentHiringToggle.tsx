'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '@/src/api/departments';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, Eye, EyeOff } from 'lucide-react';

export function DepartmentHiringToggle() {
  const queryClient = useQueryClient();

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isHiringEnabled }: { id: string; isHiringEnabled: boolean }) =>
      departmentsApi.toggleHiring(id, isHiringEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['hiring-departments'] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: departmentsApi.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  return (
    <Card className="border-neutral-200">
      <CardHeader className="flex flex-row items-center justify-between border-b p-6 bg-neutral-50/20">
        <div className="space-y-0.5">
          <CardTitle className="text-lg font-bold">Departments Directory</CardTitle>
          <p className="text-xs text-muted-foreground">
            Manage target departments and toggle their candidate hiring status.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="cursor-pointer"
        >
          {syncMutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Sync PerformX
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-semibold text-black">{dept.name}</TableCell>
                  <TableCell>
                    {dept.is_hiring_enabled ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                        Hiring Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 hover:bg-neutral-100 border-neutral-200">
                        Hiring Disabled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={toggleMutation.isPending}
                      onClick={() =>
                        toggleMutation.mutate({
                          id: dept.id,
                          isHiringEnabled: !dept.is_hiring_enabled,
                        })
                      }
                      className="cursor-pointer"
                    >
                      {dept.is_hiring_enabled ? (
                        <>
                          <EyeOff className="mr-1 h-3.5 w-3.5" /> Disable
                        </>
                      ) : (
                        <>
                          <Eye className="mr-1 h-3.5 w-3.5" /> Enable
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
export default DepartmentHiringToggle;

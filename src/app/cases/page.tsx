'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, RefreshCw, Calendar, Phone, Eye, Sprout, AlertCircle, FileX, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Case } from '@/lib/types';

interface CasesResponse {
  success: boolean;
  data: Case[];
}

export default function CasesQueuePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  // Query to fetch all cases from API
  const { data, isLoading, refetch, isFetching } = useQuery<CasesResponse>({
    queryKey: ['cases'],
    queryFn: async () => {
      const res = await fetch('/api/cases');
      if (!res.ok) throw new Error('Failed to fetch cases');
      return res.json();
    },
  });

  const cases = data?.data || [];

  // Reset filters helper
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setSortBy('NEWEST');
  };

  // Apply filters and search
  const filteredCases = cases
    .filter((c) => {
      const matchesSearch =
        c.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phoneNo.includes(searchTerm) ||
        (c.aiResponseDashboard || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'NEWEST' ? dateB - dateA : dateA - dateB;
    });

  const getStatusBadge = (status: Case['status']) => {
    switch (status) {
      case 'EXPERT_REVIEW_REQUIRED':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">Resolved</Badge>;
      case 'HIGH_CONFIDENCE':
        return <Badge variant="info">High Confidence</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRowClick = (caseId: string) => {
    router.push(`/cases/${caseId}`);
  };

  return (
    <div className="space-y-6 relative max-w-full">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Case Queue
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Human-in-the-loop validation console. Review crop diagnostics submitted via WhatsApp.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching || isLoading}
            className="flex items-center gap-2 w-full sm:w-auto h-10 shadow-xs cursor-pointer active:scale-98 duration-100"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Sync Queue
          </Button>
        </div>
      </div>

      {/* 2. STICKY Toolbar (Search & Filter Bar) */}
      <div className="sticky top-16 z-10 bg-background/90 backdrop-blur-md pb-4 pt-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="grid gap-3 sm:grid-cols-4 items-center">
          {/* Text Search Field */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            <Input
              type="text"
              placeholder="Search ID, phone, or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-xl"
              aria-label="Search cases"
            />
          </div>

          {/* Status Select */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-zinc-200 bg-card pl-10 pr-8 py-2 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-card dark:ring-offset-zinc-950 dark:focus-visible:ring-emerald-500 text-zinc-700 dark:text-zinc-300 cursor-pointer appearance-none outline-hidden"
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="EXPERT_REVIEW_REQUIRED">Pending Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="HIGH_CONFIDENCE">High Confidence</option>
            </select>
          </div>

          {/* Date Sort Select */}
          <div className="relative">
            <Calendar className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex h-10 w-full rounded-xl border border-zinc-200 bg-card pl-10 pr-8 py-2 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-card dark:ring-offset-zinc-950 dark:focus-visible:ring-emerald-500 text-zinc-700 dark:text-zinc-300 cursor-pointer appearance-none outline-hidden"
              aria-label="Sort by order"
            >
              <option value="NEWEST">Newest Submissions</option>
              <option value="OLDEST">Oldest Submissions</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Data Container */}
      {isLoading ? (
        // Dynamic loading skeletons
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="w-full h-16 bg-zinc-200/60 dark:bg-zinc-900/60 rounded-xl animate-pulse flex items-center justify-between px-6"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-zinc-300 dark:bg-zinc-800 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-zinc-300 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-36 bg-zinc-300 dark:bg-zinc-800 rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-zinc-300 dark:bg-zinc-800 rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredCases.length === 0 ? (
        // Detailed Illustration-based Empty State Screen
        <Card className="border-dashed border-2 border-zinc-300/80 dark:border-zinc-800 p-12 text-center shadow-xs">
          <CardContent className="flex flex-col items-center justify-center space-y-4 p-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500">
              <FileX className="h-8 w-8" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">No diagnostic cases found</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                We couldn&apos;t find any submissions matching your current search terms or filter selections. Try clearing your filters to see active cases.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-2"
            >
              Reset Search &amp; Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* A. MOBILE STACK LAYOUT (shown on screens < 1024px) */}
          <div className="block lg:hidden space-y-4">
            {filteredCases.map((c) => (
              <div
                key={c.caseId}
                className="bg-card rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-3.5 hover:shadow-md transition-all duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-emerald-500 outline-hidden"
                onClick={() => handleRowClick(c.caseId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleRowClick(c.caseId);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Case ${c.caseId} details. Click to review.`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{c.caseId}</span>
                    <span className="text-[11px] text-zinc-400 font-medium">{formatDate(c.createdAt)}</span>
                  </div>
                  {getStatusBadge(c.status)}
                </div>

                <div className="flex gap-3">
                  {/* Image preview with hover zoom */}
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                    <Image
                      src={c.imageUrl}
                      alt="Crop Preview"
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-110"
                      unoptimized
                    />
                  </div>
                  {/* Diagnosis snippet */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-xs text-zinc-400 flex items-center gap-1 font-semibold mb-1">
                      <Phone className="h-3 w-3" /> +{c.phoneNo}
                    </span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium truncate">
                      {c.aiResponseDashboard}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-900">
                  <Button variant="secondary" size="sm" className="h-8.5 text-xs font-semibold flex items-center gap-1">
                    Review Case <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* B. DESKTOP GRID TABLE LAYOUT (shown on screens >= 1024px) */}
          <Card className="hidden lg:block border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse text-left text-sm" role="table">
                <thead className="bg-zinc-50/70 border-b border-zinc-200/80 dark:bg-zinc-900/50 dark:border-zinc-800">
                  <tr role="row">
                    <th className="p-4 font-semibold text-zinc-500 select-none">Case ID</th>
                    <th className="p-4 font-semibold text-zinc-500 select-none">Farmer Contact</th>
                    <th className="p-4 font-semibold text-zinc-500 select-none w-16">Preview</th>
                    <th className="p-4 font-semibold text-zinc-500 select-none max-w-sm">AI Diagnostic Diagnosis</th>
                    <th className="p-4 font-semibold text-zinc-500 select-none">Received Date</th>
                    <th className="p-4 font-semibold text-zinc-500 select-none">Status</th>
                    <th className="p-4 font-semibold text-zinc-500 select-none text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/80">
                  {filteredCases.map((c) => (
                    <tr 
                      key={c.caseId} 
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-all duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:bg-zinc-50/70"
                      onClick={() => handleRowClick(c.caseId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleRowClick(c.caseId);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for case ${c.caseId} from phone number ${c.phoneNo}`}
                    >
                      <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{c.caseId}</td>
                      <td className="p-4 text-zinc-600 dark:text-zinc-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Phone className="h-3.5 w-3.5 text-zinc-400" />
                          +{c.phoneNo}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                          <Image
                            src={c.imageUrl}
                            alt="Crop Preview"
                            fill
                            className="object-cover transition-transform duration-300 hover:scale-110"
                            unoptimized
                          />
                        </div>
                      </td>
                      <td className="p-4 text-zinc-600 dark:text-zinc-300 max-w-xs truncate font-medium">
                        {c.aiResponseDashboard}
                      </td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="p-4">{getStatusBadge(c.status)}</td>
                      <td className="p-4 text-right">
                        <Button variant="secondary" size="sm" className="h-9 font-semibold flex items-center gap-1.5 cursor-pointer">
                          <Eye className="h-4 w-4" /> Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

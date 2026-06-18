'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Sprout,
  Activity,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Case, CaseStats } from '@/lib/types';

interface StatsResponse {
  success: boolean;
  stats: CaseStats;
  charts: {
    casesByStatus: Array<{ name: string; value: number; color: string }>;
    trendData: Array<{ date: string; pending: number; resolved: number; total: number }>;
    cropData: Array<{ name: string; value: number }>;
  };
}

interface CasesResponse {
  success: boolean;
  data: Case[];
}

export default function DashboardPage() {
  // Fetch stats and charts data
  const { data: statsData, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      return res.json();
    },
  });

  // Fetch recent cases list
  const { data: casesData, isLoading: casesLoading } = useQuery<CasesResponse>({
    queryKey: ['recent-cases'],
    queryFn: async () => {
      const res = await fetch('/api/cases');
      return res.json();
    },
  });

  const stats = statsData?.stats;
  const charts = statsData?.charts;
  const recentCases = casesData?.data?.slice(0, 4) || [];

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

  const getCropColor = (name: string) => {
    const colors: { [key: string]: string } = {
      Cacao: '#5C3A21',
      Tomato: '#EF4444',
      Maize: '#F59E0B',
      Coffee: '#78350F',
      Cassava: '#10B981',
      Rice: '#3B82F6',
      Other: '#6B7280'
    };
    return colors[name] || colors.Other;
  };

  if (statsLoading || casesLoading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/3" />
        
        {/* Cards Skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-2xl lg:col-span-2" />
          <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Overview
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time analytics for agricultural crop disease diagnostics and expert reviews.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/cases">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> View Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Cases */}
        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Total Cases</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
              <ClipboardList className="h-4.5 w-4.5 text-zinc-600 dark:text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{stats?.totalCases}</div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1">
              <Activity className="h-3 w-3 text-emerald-500" /> WhatsApp channels active
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Pending Reviews */}
        <Card className="hover:shadow-md transition-shadow duration-300 border-amber-250 dark:border-amber-950/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Pending Reviews</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <Clock className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{stats?.pendingReviews}</div>
            <p className="text-[11px] text-amber-650 dark:text-amber-400 mt-1.5 flex items-center gap-1">
              Requires expert intervention
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Resolved Cases */}
        <Card className="hover:shadow-md transition-shadow duration-300 border-emerald-200 dark:border-emerald-950/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Resolved Cases</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
              <CheckCircle2 className="h-4.5 w-4.5 text-[#2E7D32] dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-[#2E7D32] dark:text-emerald-400">{stats?.resolvedCases}</div>
            <p className="text-[11px] text-emerald-650 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-[#2E7D32]" /> Responses sent to farmer
            </p>
          </CardContent>
        </Card>

        {/* Card 4: High Confidence */}
        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">High Confidence</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <Sparkles className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{stats?.highConfidenceCases}</div>
            <p className="text-[11px] text-blue-650 dark:text-blue-400 mt-1.5 flex items-center gap-1">
              AI confidence score &gt; 90%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Weekly Trend Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <TrendingUp className="h-5 w-5 text-[#2E7D32]" />
              Weekly Case Volume
            </CardTitle>
            <CardDescription>
              Volume breakdown of newly received and resolved cases over the past 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={charts?.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-card)',
                    color: 'var(--color-foreground)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                  }} 
                />
                <Bar dataKey="resolved" name="Resolved" fill="var(--color-primary)" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[4, 4, 0, 0]} stackId="a" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Crop Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <Sprout className="h-5 w-5 text-[#2E7D32]" />
              Crop Susceptibility
            </CardTitle>
            <CardDescription>
              Distribution of diagnoses categorized by commodity type.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-between h-[280px]">
            <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.cropData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts?.cropData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCropColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #E4E4E7'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 w-full text-xs mt-2 overflow-y-auto max-h-[80px]">
              {charts?.cropData?.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCropColor(entry.name) }} />
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases Section */}
      <Card className="border-zinc-200/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
              Recent Submissions
            </CardTitle>
            <CardDescription>
              Latest incoming farmer messages awaiting processing or recently closed.
            </CardDescription>
          </div>
          <Link href="/cases">
            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-[#2E7D32] hover:text-[#1B5E20] dark:text-emerald-400">
              All Cases <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 dark:bg-zinc-900/50 dark:border-zinc-800">
                <tr>
                  <th className="p-4 font-semibold text-zinc-500 select-none">Case ID</th>
                  <th className="p-4 font-semibold text-zinc-500 select-none">Farmer Phone</th>
                  <th className="p-4 font-semibold text-zinc-500 select-none">Preview</th>
                  <th className="p-4 font-semibold text-zinc-500 select-none">AI Suspected Diagnosis</th>
                  <th className="p-4 font-semibold text-zinc-500 select-none">Status</th>
                  <th className="p-4 font-semibold text-zinc-500 select-none text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/80">
                {recentCases.map((c) => (
                  <tr key={c.caseId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">{c.caseId}</td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">+{c.phoneNo}</td>
                    <td className="p-4">
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <Image
                          src={c.imageUrl}
                          alt="Crop Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400 font-medium max-w-xs truncate">
                      {c.aiResponseDashboard}
                    </td>
                    <td className="p-4">{getStatusBadge(c.status)}</td>
                    <td className="p-4 text-right">
                      <Link href={`/cases/${c.caseId}`}>
                        <Button variant="secondary" size="sm">
                          Review
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

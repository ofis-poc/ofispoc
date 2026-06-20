'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Send, 
  Phone, 
  Clock, 
  Sparkles, 
  Maximize2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Case } from '@/lib/types';

interface CaseResponse {
  success: boolean;
  data: Case;
}

interface ResolvePayload {
  expertDiagnosis: string;
  expertRecommendation: string;
  messageToFarmer: string;
  phoneNo: string;
}

export default function CaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const queryClient = useQueryClient();
  const [caseId, setCaseId] = useState<string>('');
  
  // Unwrap parameters
  useEffect(() => {
    params.then((p) => setCaseId(p.id));
  }, [params]);

  const [diagnosis, setDiagnosis] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [message, setMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMessageManuallyEdited, setIsMessageManuallyEdited] = useState(false);

  // Fetch case details
  const { data, isLoading, error } = useQuery<CaseResponse>({
    queryKey: ['case', caseId],
    queryFn: async () => {
      if (!caseId) throw new Error('No case ID');
      const res = await fetch(`/api/cases/${caseId}`);
      if (!res.ok) throw new Error('Failed to load case');
      return res.json();
    },
    enabled: !!caseId,
  });

  const caseItem = data?.data;

  // Sync state if already resolved
  useEffect(() => {
    if (caseItem && caseItem.status === 'RESOLVED') {
      setTimeout(() => {
        setDiagnosis(caseItem.expertDiagnosis || '');
        setRecommendation(caseItem.expertRecommendation || '');
        setMessage(caseItem.messageToFarmer || '');
        setIsMessageManuallyEdited(true);
      }, 0);
    }
  }, [caseItem]);

  // Close fullscreen preview on Escape keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofill message template when diagnosis or recommendation changes
  useEffect(() => {
    if (!isMessageManuallyEdited && caseItem?.status !== 'RESOLVED') {
      const template = `Expert Diagnosis: ${diagnosis || '[suspected disease]'}\n\nRecommendation:\n${recommendation || '[treatment options]'}\n\nThank you for reaching out. Please contact us if you notice further issues.`;
      setTimeout(() => {
        setMessage(template);
      }, 0);
    }
  }, [diagnosis, recommendation, isMessageManuallyEdited, caseItem]);

  // Mutation to resolve a case
  const resolveMutation = useMutation({
    mutationFn: async (payload: ResolvePayload) => {
      const res = await fetch(`/api/cases/${caseId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      alert(data.webhookWarning 
        ? `Response saved! Status: RESOLVED.\n\n⚠️ Note: The outbound webhook reported an issue: ${data.webhookWarning}`
        : 'Expert response sent to farmer successfully! Case status updated to RESOLVED.'
      );
    },
    onError: (err: Error) => {
      alert(`Error submitting response: ${err.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseItem) return;
    
    if (!diagnosis.trim()) {
      alert('Please fill out the Expert Diagnosis field');
      return;
    }
    if (!recommendation.trim()) {
      alert('Please fill out the Expert Recommendation field');
      return;
    }
    if (!message.trim()) {
      alert('Please review and confirm the message to send to the farmer.');
      return;
    }

    resolveMutation.mutate({
      expertDiagnosis: diagnosis,
      expertRecommendation: recommendation,
      messageToFarmer: message,
      phoneNo: caseItem.phoneNo,
    });
  };

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

  if (isLoading) {
    return (
      <div className="py-20 text-center text-zinc-500 animate-pulse">
        Loading case details...
      </div>
    );
  }

  if (error || !caseItem) {
    return (
      <div className="py-20 text-center text-red-500">
        <AlertCircle className="h-10 w-10 mx-auto mb-2" />
        Error: Could not retrieve diagnostic case details.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back & Status Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cases">
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-sm font-medium">Cases</span>
            <ChevronRight className="h-4 w-4 text-zinc-400" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {caseItem.caseId}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(caseItem.status)}
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {formatDate(caseItem.createdAt)}
          </span>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Farmer Image & Info (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Diagnostic Crop Photo Card */}
          <Card className="overflow-hidden border-zinc-200/80 shadow-xs relative group">
            <div className="relative aspect-video w-full bg-zinc-900 flex items-center justify-center overflow-hidden">
              {caseItem.imageUrl ? (
                <Image
                  src={caseItem.imageUrl}
                  alt="Farmer Crop Submission"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-zinc-400 text-sm">
                  No image available
                </div>
              )}
              {caseItem.imageUrl && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white text-zinc-900 hover:bg-zinc-150 border-none rounded-full"
                    onClick={() => setIsFullscreen(true)}
                  >
                    <Maximize2 className="h-4 w-4 mr-1.5" /> Fullscreen View
                  </Button>
                </div>
              )}
            </div>
            <CardHeader className="py-4 px-6 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-sm font-semibold">Farmer Contact:</span>
                  <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                    <Phone className="h-4 w-4 text-zinc-400" />
                    {caseItem.phoneNo ? `+${caseItem.phoneNo}` : 'Unknown'}
                  </span>
                </div>
                {caseItem.resolvedAt && (
                  <span className="text-xs text-[#2E7D32] dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Resolved: {formatDate(caseItem.resolvedAt)}
                  </span>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* AI Analysis Diagnostic Logs */}
          <Card className="border-zinc-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                <Sparkles className="h-4.5 w-4.5 text-blue-500" />
                AI Diagnostic Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dashboard AI Insight */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/40">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Expert Insights (For Dashboard)</h4>
                    <p className="text-sm text-blue-900 dark:text-blue-300 mt-1 font-medium">
                      {caseItem.aiResponseDashboard 
                        ? (typeof caseItem.aiResponseDashboard === 'object' 
                            ? JSON.stringify(caseItem.aiResponseDashboard) 
                            : String(caseItem.aiResponseDashboard)) 
                        : 'No AI analysis available.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Farmer AI Response */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/60 dark:bg-zinc-900/50 dark:border-zinc-800">
                <div className="flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-zinc-400 mt-2 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Automated Farmer Greeting (Sent via WhatsApp)</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                      &quot;{caseItem.aiResponseFarmer 
                        ? (typeof caseItem.aiResponseFarmer === 'object' 
                            ? JSON.stringify(caseItem.aiResponseFarmer) 
                            : String(caseItem.aiResponseFarmer)) 
                        : 'No automated farmer response available.'}&quot;
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Expert Diagnosis Submission (5 cols) */}
        <div className="lg:col-span-5">
          <Card className={`border-zinc-200/80 shadow-xs h-full flex flex-col ${caseItem.status === 'RESOLVED' ? 'bg-zinc-50/50 dark:bg-zinc-950' : ''}`}>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                <FileCheck className="h-4.5 w-4.5 text-[#2E7D32]" />
                Expert Recommendation Review
              </CardTitle>
              <CardDescription>
                {caseItem.status === 'RESOLVED' 
                  ? 'This case has been resolved. Below is the diagnostic record.'
                  : 'Review the AI findings, enter your diagnostic review, and hit Send to push directly back to the farmer\'s WhatsApp chat.'
                }
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <CardContent className="space-y-4 flex-1">
                {/* Expert Diagnosis Field */}
                <div className="space-y-1.5">
                  <label htmlFor="expert-diagnosis" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Expert Diagnosis
                  </label>
                  <Input
                    id="expert-diagnosis"
                    placeholder="e.g. Cacao Black Pod Disease (Phytophthora)"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    disabled={caseItem.status === 'RESOLVED'}
                    required
                  />
                </div>

                {/* Expert Recommendation Field */}
                <div className="space-y-1.5">
                  <label htmlFor="expert-recs" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Treatment &amp; Recommendations
                  </label>
                  <Textarea
                    id="expert-recs"
                    placeholder="Provide actionable steps for the farmer (e.g. Spray copper-based fungicide, prune shaded leaves)"
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    disabled={caseItem.status === 'RESOLVED'}
                    className="min-h-[100px] resize-y"
                    required
                  />
                </div>

                {/* Message to Farmer Field (Preview) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="farmer-msg" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Message to Farmer (WhatsApp Delivery)
                    </label>
                    {caseItem.status !== 'RESOLVED' && isMessageManuallyEdited && (
                      <button
                        type="button"
                        onClick={() => setIsMessageManuallyEdited(false)}
                        className="text-[10px] text-[#2E7D32] hover:underline font-semibold"
                      >
                        Reset to Template
                      </button>
                    )}
                  </div>
                  <Textarea
                    id="farmer-msg"
                    rows={7}
                    placeholder="This message will be sent directly to the farmer over WhatsApp."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setIsMessageManuallyEdited(true);
                    }}
                    disabled={caseItem.status === 'RESOLVED'}
                    className="font-sans text-sm min-h-[160px] resize-y border-emerald-100 bg-emerald-50/10 focus-visible:ring-emerald-500"
                    required
                  />
                </div>
              </CardContent>

              {caseItem.status !== 'RESOLVED' && (
                <CardFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2"
                    disabled={resolveMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                    {resolveMutation.isPending ? 'Sending...' : 'SEND TO FARMER'}
                  </Button>
                </CardFooter>
              )}
            </form>
          </Card>
        </div>
      </div>

      {/* Full Screen Image Modal Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-all duration-300">
          <button 
            onClick={() => setIsFullscreen(false)} 
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <Image
              src={caseItem.imageUrl}
              alt="Crop Diagnostic Fullscreen"
              width={1200}
              height={900}
              className="object-contain max-w-full max-h-full rounded-lg shadow-2xl"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}

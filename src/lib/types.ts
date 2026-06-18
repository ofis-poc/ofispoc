export type CaseStatus = 'EXPERT_REVIEW_REQUIRED' | 'RESOLVED' | 'HIGH_CONFIDENCE';

export interface Case {
  caseId: string;
  phoneNo: string;
  imageUrl: string;
  aiResponseFarmer: string;
  aiResponseDashboard: string;
  status: CaseStatus;
  createdAt: string;
  
  // Expert feedback fields
  expertDiagnosis?: string;
  expertRecommendation?: string;
  messageToFarmer?: string;
  resolvedAt?: string;
}

export interface CaseStats {
  totalCases: number;
  pendingReviews: number;
  resolvedCases: number;
  highConfidenceCases: number;
}

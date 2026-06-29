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

export interface CreateCaseRequest {
  caseId: string;
  phoneNo: string;
  imageUrl: string;
  aiResponseFarmer?: string;
  aiResponseDashboard?: unknown; // Can be object, array, or string
  status?: CaseStatus;
  createdAt?: string;
}

export interface ResolveCaseRequest {
  expertDiagnosis: string;
  expertRecommendation: string;
  messageToFarmer: string;
  phoneNo: string;
}

export type QuestionType = 'single' | 'numeric' | 'text' | 'voice';

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  questionEn: string;
  questionHi?: string;
  questionEs?: string;
  questionTh?: string;
  optionsEn?: string[];
  optionsHi?: string[];
  optionsEs?: string[];
  optionsTh?: string[];
  questionType: QuestionType;
  questionOrder: number;
  required: boolean;
}

export interface Survey {
  id: string;
  name: string;
  description?: string;
  status: 'Draft' | 'Published';
  languages: string[];
  createdAt: string;
  questions?: SurveyQuestion[];
  questionCount?: number;
}

export interface Farmer {
  id: number;
  phoneNo: string;
  name?: string;
  language: string;
}

export interface SurveyAssignment {
  id: number;
  surveyId: string;
  phoneNo: string;
  assignedAt: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}





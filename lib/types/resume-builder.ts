/**
 * Resume Builder Types
 * Type definitions for resume drafts and templates
 */

export type ResumeStep = 'basic_info' | 'work_history' | 'education' | 'summary' | 'review';

export interface BasicInfo {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  start_date: string; // YYYY-MM format
  end_date?: string; // YYYY-MM format
  is_current: boolean;
  raw_description: string;
  enhanced_bullets: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  field?: string;
  graduation_year?: string;
}

export interface ResumeData {
  basic_info?: BasicInfo;
  work_history?: WorkExperience[];
  education?: Education[];
  skills?: string[];
  summary?: string;
}

export interface ResumeDraft {
  id: string;
  user_id: string | null;
  step_completed: ResumeStep | null;
  data: ResumeData;
  created_at: string;
  updated_at: string;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string | null;
  template_data: {
    fonts: {
      heading: string;
      body: string;
    };
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    layout: {
      margins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
      };
      spacing: {
        section: number;
        item: number;
      };
    };
    sections: {
      order: string[];
      header: {
        align: string;
        fontSize: number;
      };
      summary: {
        show: boolean;
        fontSize: number;
      };
      experience: {
        showDates: boolean;
        bulletStyle: string;
        fontSize: number;
      };
      education: {
        showGradYear: boolean;
        fontSize: number;
      };
      skills: {
        layout: string;
        separator: string;
        fontSize: number;
      };
    };
  };
  is_active: boolean;
  created_at: string;
}

// API Request/Response Types

export interface UpdateDraftRequest {
  step_completed?: ResumeStep;
  data: Partial<ResumeData>;
}

export interface EnhanceContentRequest {
  job_description: string;
  context?: {
    company?: string;
    title?: string;
  };
}

export interface EnhanceContentResponse {
  needs_clarification: boolean;
  questions?: string[];
  suggestions: string[];
}

export interface GenerateSummaryRequest {
  work_history: WorkExperience[];
  education: Education[];
  skills: string[];
}

export interface GenerateSummaryResponse {
  summaries: string[];
}

export type ExportFormat = 'pdf' | 'docx' | 'txt';

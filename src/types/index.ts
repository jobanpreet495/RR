export interface ContactInfo {
  name: string | null;
  phone: string | null;
  email: string | null;
  linkedin: string | null;
}

export interface ResumeAnalysis {
  contact_info: ContactInfo;
  relevance_score: number;
  current_position: string | null;
  relevant_skills: string[] | null;
  experience_years: string | null;
  strengths: string[] | null;
  improvements: string[] | null;
}

export interface APIEndpoints {
  UPLOAD: string;
  RETRIEVE: string;
  DOWNLOAD: string;
} 
export type WorkplaceType = "Remote" | "Hybrid" | "On-site";
export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Internship";
export type ExperienceLevel = "Fresher (0-1 yrs)" | "1-3 years" | "3-5 years" | "5+ years" | "Executive / Lead";
export type JobStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Job {
  id: string;
  title: string;
  company: string;
  companyWebsite?: string;
  companyLogo?: string;
  category: string;
  workplaceType: WorkplaceType;
  location: string;
  employmentType: EmploymentType;
  experience: ExperienceLevel;
  salary: string;
  skills: string[];
  description: string;
  applyMethod: "url" | "email";
  applyValue: string;
  recruiterName: string;
  recruiterEmail: string;
  recruiterPhone?: string;
  status: JobStatus;
  featured: boolean;
  featuredInTopGrid?: boolean;
  isNew?: boolean;
  rejectionReason?: string;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type JobInput = Omit<Job, "id" | "status" | "featured" | "rejectionReason" | "viewsCount" | "createdAt" | "updatedAt" | "recruiterName" | "recruiterEmail"> & {
  recruiterName?: string;
  recruiterEmail?: string;
  status?: JobStatus;
  featured?: boolean;
  featuredInTopGrid?: boolean;
  isNew?: boolean;
};

export interface JobFilters {
  search?: string;
  category?: string;
  workplaceType?: string;
  experience?: string;
  employmentType?: string;
  location?: string;
  featuredInTopGrid?: boolean;
}

export const JOB_CATEGORIES = [
  "ALL STATE JOBS",
  "GOVT & PSU JOBS",
  "BANK & FINANCIAL JOBS",
  "TECH & SOFTWARE JOBS",
  "DEFENCE & POLICE JOBS",
  "ENGINEERING & DIPLOMA",
  "POST OFFICE & RAILWAYS",
  "TEACHING & EDUCATION",
  "IMPORTANT NOTIFICATIONS & PDFS",
  "PRIVATE & CORPORATE JOBS",
] as const;

export const PORTAL_BOX_CATEGORIES = [
  { id: "all-state", title: "ALL STATE JOBS", tag: "State Govt & Departments" },
  { id: "govt-jobs", title: "GOVT JOBS", tag: "Central Govt & PSUs" },
  { id: "defence-jobs", title: "DEFENCE & ARMED FORCES", tag: "Army, Navy & Air Force" },
  { id: "tech-jobs", title: "TECH & SOFTWARE JOBS", tag: "IT, Developers & AI" },
  { id: "bank-jobs", title: "BANK & FINANCE JOBS", tag: "SBI, IBPS & Private Banks" },
  { id: "railway-jobs", title: "RAILWAYS & POST OFFICE", tag: "RRB & India Post" },
  { id: "engineering-jobs", title: "ENGINEERING JOBS", tag: "B.Tech, Diploma & Core" },
  { id: "teaching-jobs", title: "TEACHING & EDUCATION", tag: "Professors, KVS & CTET" },
  { id: "notifications", title: "IMPORTANT PDF NOTIFICATIONS", tag: "Admit Cards, Results & Forms" },
] as const;

export const EXPERIENCE_LEVELS = [
  "Fresher (0-1 yrs)",
  "1-3 years",
  "3-5 years",
  "5+ years",
  "Executive / Lead",
] as const;

export const WORKPLACE_TYPES = ["Remote", "Hybrid", "On-site"] as const;

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"] as const;

export const POPULAR_LOCATIONS = [
  "All India",
  "Remote (India)",
  "Delhi NCR",
  "Bengaluru, Karnataka",
  "Hyderabad, Telangana",
  "Mumbai, Maharashtra",
  "Pune, Maharashtra",
  "Chennai, Tamil Nadu",
  "Kolkata, West Bengal",
] as const;

// Default Admin Key
export const DEFAULT_ADMIN_KEY = process.env.ADMIN_SECRET_KEY || "selectedadmin2026";
export const ADMIN_COOKIE_NAME = "selectedjobs_admin_auth";

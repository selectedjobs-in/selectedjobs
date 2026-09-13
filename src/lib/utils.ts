export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export function getWorkplaceBadgeColor(type: string): string {
  switch (type) {
    case "Remote":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
    case "Hybrid":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
    case "On-site":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
  }
}

export function getStatusBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return {
        label: "Live / Approved",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-300",
      };
    case "PENDING":
      return {
        label: "Pending Review",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300 animate-pulse",
      };
    case "REJECTED":
      return {
        label: "Rejected",
        className: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border-rose-300",
      };
    default:
      return {
        label: status,
        className: "bg-zinc-100 text-zinc-800 border-zinc-300",
      };
  }
}

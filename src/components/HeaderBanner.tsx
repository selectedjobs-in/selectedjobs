import Link from "next/link";
import { Briefcase } from "lucide-react";

export default function HeaderBanner() {
  return (
    <div className="w-full bg-[#1c64f2] text-white py-8 px-4 text-center border-b border-blue-700 shadow-inner">
      <div className="mx-auto max-w-7xl flex flex-col items-center justify-center">
        {/* Main Portal Title */}
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1c64f2] shadow-md group-hover:scale-105 transition-transform">
            <Briefcase className="h-7 w-7" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Selected Jobs
            </h1>
            <p className="text-xs sm:text-sm font-medium text-blue-100 tracking-wide">
              A True Job Portal &bull; selectedjobs.in
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

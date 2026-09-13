interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

export default function InfoCard({ title, children }: InfoCardProps) {
  return (
    <div className="rounded border border-blue-300 bg-white shadow-sm overflow-hidden my-4">
      {/* Blue Header Bar */}
      <div className="bg-[#1d4ed8] text-white px-4 py-2 font-bold text-xs sm:text-sm tracking-wide">
        {title}
      </div>
      {/* Content */}
      <div className="p-4 sm:p-5 text-xs sm:text-sm text-zinc-700 leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

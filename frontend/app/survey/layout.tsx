export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-grey-50">
      <header className="bg-[#150027] px-6 py-4">
        <span className="text-white font-semibold text-lg tracking-tight">Xebia</span>
        <span className="text-white/50 text-sm ml-3">AI Maturity Assessment</span>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">{children}</main>
    </div>
  );
}

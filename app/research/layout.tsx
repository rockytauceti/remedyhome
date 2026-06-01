import NavHeader from "@/components/NavHeader";

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <NavHeader section="Find a Remedy" />
      {children}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b border-stone-200 bg-white px-4 py-4 h-[57px]" />
      <div className="max-w-3xl mx-auto px-6 py-10 animate-pulse">
        <div className="h-7 w-48 bg-stone-200 rounded mb-2" />
        <div className="h-4 w-64 bg-stone-100 rounded mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 h-16" />
          ))}
        </div>
      </div>
    </div>
  );
}

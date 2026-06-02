export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b border-stone-200 bg-white px-4 py-4 h-[57px]" />
      <div className="max-w-3xl mx-auto px-6 py-10 animate-pulse">
        <div className="h-7 w-44 bg-stone-200 rounded mb-2" />
        <div className="h-4 w-56 bg-stone-100 rounded mb-8" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-4 h-20" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b border-stone-200 bg-white px-4 py-4 h-[57px]" />
      <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse">
        <div className="h-7 w-40 bg-stone-200 rounded mb-2" />
        <div className="h-4 w-52 bg-stone-100 rounded mb-10" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
              <div className="h-36 bg-stone-100" />
              <div className="p-5">
                <div className="h-4 w-32 bg-stone-200 rounded mb-2" />
                <div className="h-3 w-full bg-stone-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

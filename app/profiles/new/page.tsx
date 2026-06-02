import Link from "next/link";
import { createProfile } from "@/app/actions/profiles";
import NavHeader from "@/components/NavHeader";
import SubmitButton from "@/components/SubmitButton";

export default async function NewProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ clientGroupId?: string }>;
}) {
  const { clientGroupId } = await searchParams;

  return (
    <div className="min-h-screen bg-stone-50">
      <NavHeader section="New Profile" />

      <main className="max-w-lg mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold mb-1">Add a family member</h2>
        <p className="text-stone-500 text-sm mb-8">Create a profile to track remedies and outcomes for this person.</p>

        <form action={createProfile} className="space-y-5">
          {clientGroupId && (
            <input type="hidden" name="clientGroupId" value={clientGroupId} />
          )}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Emma"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Date of birth</label>
            <input
              name="dateOfBirth"
              type="date"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Gender</label>
            <select
              name="gender"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Prefer not to say</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Constitutional notes
              <span className="text-stone-400 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="e.g. Tends toward Pulsatilla type, sensitive to cold, recurring ear infections..."
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <SubmitButton label="Create profile" loadingLabel="Creating…" />
            <Link
              href="/profiles"
              className="px-5 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg border border-stone-200 hover:border-stone-300"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

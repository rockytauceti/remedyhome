import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { createProfile } from "@/app/actions/profiles";

export default function NewProfilePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-semibold text-green-800">RemedyHome</Link>
          <span className="text-stone-300">/</span>
          <Link href="/profiles" className="text-stone-600 font-medium hover:text-stone-900">Family Profiles</Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-600">New</span>
        </div>
        <UserButton />
      </header>

      <main className="max-w-lg mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold mb-1">Add a family member</h2>
        <p className="text-stone-500 text-sm mb-8">Create a profile to track remedies and outcomes for this person.</p>

        <form action={createProfile} className="space-y-5">
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
              <option value="Other">Other</option>
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
            <button
              type="submit"
              className="px-5 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800"
            >
              Create profile
            </button>
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

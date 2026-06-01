import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateDbUser } from "@/lib/user";
import NavHeader from "@/components/NavHeader";
import { createClientGroup } from "@/app/actions/clients";

export default async function NewClientPage() {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");
  if (user.plan !== "PRACTITIONER") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-stone-50">
      <NavHeader section="New Client" />

      <main className="max-w-lg mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold mb-1">Add a client family</h2>
        <p className="text-stone-500 text-sm mb-8">
          Create a group to organize profiles and journal entries for one patient family.
        </p>

        <form action={createClientGroup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Family / client name <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Johnson Family, Maria S."
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Notes <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Constitutional tendencies, key history, referral source…"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800"
            >
              Create client
            </button>
            <Link
              href="/clients"
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

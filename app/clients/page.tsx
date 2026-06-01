import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateDbUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import NavHeader from "@/components/NavHeader";

export default async function ClientsPage() {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");
  if (user.plan !== "PRACTITIONER") redirect("/dashboard");

  const groups = await prisma.clientGroup.findMany({
    where: { userId: user.id },
    include: { profiles: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <NavHeader section="Clients" />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold">Client Families</h2>
            <p className="text-stone-500 text-sm mt-1">Each group is one patient family with their own profiles and journal</p>
          </div>
          <Link
            href="/clients/new"
            className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800"
          >
            + New client
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-stone-200 rounded-xl">
            <p className="text-stone-400 text-lg mb-4">No clients yet</p>
            <Link href="/clients/new" className="text-green-700 font-medium hover:underline">
              Add your first client family
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/clients/${group.id}`}
                className="bg-white rounded-xl border border-stone-200 p-5 flex items-center justify-between hover:border-green-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold text-lg">
                    {group.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">{group.name}</p>
                    <p className="text-sm text-stone-400">
                      {group.profiles.length === 0
                        ? "No profiles yet"
                        : group.profiles.map((p) => p.name).join(", ")}
                    </p>
                  </div>
                </div>
                <svg className="text-stone-300 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

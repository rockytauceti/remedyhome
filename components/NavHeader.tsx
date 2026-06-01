import { getOrCreateDbUser } from "@/lib/user";
import NavMenu from "./NavMenu";

export default async function NavHeader({ section }: { section?: string }) {
  const user = await getOrCreateDbUser();
  return <NavMenu section={section} plan={user?.plan ?? "FREE"} />;
}

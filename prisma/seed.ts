import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sources } from "./seeds/sources";
import { remedies } from "./seeds/remedies";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding sources...");
  for (const source of sources) {
    await prisma.source.upsert({
      where: { slug: source.slug },
      update: source,
      create: source,
    });
  }

  console.log("Seeding remedies...");
  for (const remedy of remedies) {
    const data = remedy as Prisma.RemedyCreateInput;
    await prisma.remedy.upsert({
      where: { abbreviation: remedy.abbreviation },
      update: data,
      create: data,
    });
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

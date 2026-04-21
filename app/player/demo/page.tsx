import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DemoRedirectPage = async () => {
  noStore();
  const latest = await prisma.audiobook.findFirst({
    where: { isPublished: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });
  if (latest) {
    redirect(`/books/${latest.id}`);
  }
  redirect("/");
};

export default DemoRedirectPage;

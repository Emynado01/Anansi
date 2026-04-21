import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { safePublicQuery } from "@/lib/public-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PlayerIndexPage = async () => {
  noStore();
  const { data: latest } = await safePublicQuery(
    "player_index",
    null,
    () =>
      prisma.audiobook.findFirst({
        where: { isPublished: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      }),
  );
  if (latest) {
    redirect(`/books/${latest.id}`);
  }
  redirect("/");
};

export default PlayerIndexPage;

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

const PlayerIndexPage = async () => {
  const latest = await prisma.audiobook.findFirst({
    where: { isPublished: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });
  if (latest) {
    redirect(`/books/${latest.id}`);
  }
  redirect("/");
};

export default PlayerIndexPage;

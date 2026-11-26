import { redirect } from "next/navigation";

import { requireRole } from "@/server/auth/guards";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManagerInquiryDetailRedirect({
  params,
}: PageProps) {
  await requireRole("MANAGER", "/manager/inquiries");
  const { id } = await params;
  redirect(`/manager/inquiries?id=${encodeURIComponent(id)}`);
}

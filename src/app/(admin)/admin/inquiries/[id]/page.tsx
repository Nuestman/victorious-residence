import { redirect } from "next/navigation";

import { requireAdmin } from "@/server/auth/guards";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminInquiryDetailRedirect({
  params,
}: PageProps) {
  await requireAdmin("/admin/inquiries");
  const { id } = await params;
  redirect(`/admin/inquiries?id=${encodeURIComponent(id)}`);
}

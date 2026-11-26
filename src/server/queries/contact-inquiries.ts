import { and, count, desc, eq, ne } from "drizzle-orm";

import { db } from "@/server/db";
import { duringRequest } from "@/server/db/request";
import {
  contactInquiries,
  contactInquiryReplies,
  users,
  type ContactInquiryStatus,
} from "@/server/db/schema";

export type InquiryFolder = "inbox" | "unread" | "archived" | "all";

export async function listContactInquiries(options?: {
  folder?: InquiryFolder;
  limit?: number;
}) {
  await duringRequest();
  const folder = options?.folder ?? "inbox";
  const limit = options?.limit ?? 100;

  const base = db
    .select({
      id: contactInquiries.id,
      name: contactInquiries.name,
      email: contactInquiries.email,
      phone: contactInquiries.phone,
      subject: contactInquiries.subject,
      message: contactInquiries.message,
      status: contactInquiries.status,
      emailSentAt: contactInquiries.emailSentAt,
      createdAt: contactInquiries.createdAt,
      updatedAt: contactInquiries.updatedAt,
    })
    .from(contactInquiries);

  const folderWhere =
    folder === "inbox"
      ? ne(contactInquiries.status, "ARCHIVED")
      : folder === "unread"
        ? eq(contactInquiries.status, "NEW")
        : folder === "archived"
          ? eq(contactInquiries.status, "ARCHIVED")
          : undefined;

  const rows = folderWhere
    ? await base
        .where(folderWhere)
        .orderBy(desc(contactInquiries.createdAt))
        .limit(limit)
    : await base.orderBy(desc(contactInquiries.createdAt)).limit(limit);

  return rows;
}

export async function getContactInquiryById(id: string) {
  await duringRequest();
  const [row] = await db
    .select()
    .from(contactInquiries)
    .where(eq(contactInquiries.id, id))
    .limit(1);
  return row ?? null;
}

export async function listContactInquiryReplies(inquiryId: string) {
  await duringRequest();
  return db
    .select({
      id: contactInquiryReplies.id,
      inquiryId: contactInquiryReplies.inquiryId,
      authorId: contactInquiryReplies.authorId,
      body: contactInquiryReplies.body,
      emailSentAt: contactInquiryReplies.emailSentAt,
      createdAt: contactInquiryReplies.createdAt,
      authorName: users.fullName,
    })
    .from(contactInquiryReplies)
    .leftJoin(users, eq(contactInquiryReplies.authorId, users.id))
    .where(eq(contactInquiryReplies.inquiryId, inquiryId))
    .orderBy(contactInquiryReplies.createdAt);
}

export async function countContactInquiriesByStatus(
  status: ContactInquiryStatus,
) {
  await duringRequest();
  const [row] = await db
    .select({ value: count() })
    .from(contactInquiries)
    .where(eq(contactInquiries.status, status));
  return Number(row?.value ?? 0);
}

export async function countNewContactInquiries() {
  return countContactInquiriesByStatus("NEW");
}

export async function countInboxContactInquiries() {
  await duringRequest();
  const [row] = await db
    .select({ value: count() })
    .from(contactInquiries)
    .where(ne(contactInquiries.status, "ARCHIVED"));
  return Number(row?.value ?? 0);
}

/** Only NEW → READ. Never overrides ARCHIVED or intentional unread after staff action. */
export async function markInquiryReadIfNew(id: string) {
  await duringRequest();
  await db
    .update(contactInquiries)
    .set({ status: "READ" })
    .where(and(eq(contactInquiries.id, id), eq(contactInquiries.status, "NEW")));
}

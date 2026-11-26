import type {
  InboxListItem,
  InboxThreadMessage,
} from "@/components/inquiries/messages-inbox";
import type { ContactInquiry } from "@/server/db/schema";
import type { InquiryFolder } from "@/server/queries/contact-inquiries";

export function parseInquiryFolder(raw: string | undefined): InquiryFolder {
  switch (raw) {
    case "unread":
    case "archived":
    case "all":
      return raw;
    case "inbox":
    case undefined:
      return "inbox";
    default:
      return "inbox";
  }
}

export function toInboxListItem(row: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: ContactInquiry["status"];
  createdAt: Date;
}): InboxListItem {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export function buildInquiryThread(options: {
  inquiry: ContactInquiry;
  replies: Array<{
    id: string;
    body: string;
    createdAt: Date;
    emailSentAt: Date | null;
    authorName: string | null;
  }>;
}): InboxThreadMessage[] {
  const inbound: InboxThreadMessage = {
    id: `inbound-${options.inquiry.id}`,
    kind: "inbound",
    authorLabel: options.inquiry.name,
    body: options.inquiry.message,
    createdAt: options.inquiry.createdAt.toISOString(),
    emailSentAt: options.inquiry.emailSentAt?.toISOString() ?? null,
  };

  const outbound = options.replies.map((reply) => ({
    id: reply.id,
    kind: "outbound" as const,
    authorLabel: reply.authorName?.trim() || "Staff",
    body: reply.body,
    createdAt: reply.createdAt.toISOString(),
    emailSentAt: reply.emailSentAt?.toISOString() ?? null,
  }));

  return [inbound, ...outbound];
}

import { MessagesInbox } from "@/components/inquiries/messages-inbox";
import { PortalShell } from "@/components/portal-shell";
import {
  buildInquiryThread,
  parseInquiryFolder,
  toInboxListItem,
} from "@/lib/inquiries-ui";
import { requireRole } from "@/server/auth/guards";
import {
  getContactInquiryById,
  listContactInquiries,
  listContactInquiryReplies,
} from "@/server/queries/contact-inquiries";

export const instant = false;

type PageProps = {
  searchParams: Promise<{ id?: string; folder?: string; status?: string }>;
};

export default async function ManagerInquiriesPage({
  searchParams,
}: PageProps) {
  const session = await requireRole("MANAGER", "/manager/inquiries");
  const params = await searchParams;
  const folder = parseInquiryFolder(
    params.folder ??
      (params.status === "NEW"
        ? "unread"
        : params.status === "ARCHIVED"
          ? "archived"
          : params.status === "ALL"
            ? "all"
            : undefined),
  );
  const items = await listContactInquiries({ folder });
  const selectedId = params.id ?? null;
  const selectedRow = selectedId
    ? await getContactInquiryById(selectedId)
    : null;
  const replies = selectedRow
    ? await listContactInquiryReplies(selectedRow.id)
    : [];

  const listItems = items.map(toInboxListItem);
  const selected = selectedRow ? toInboxListItem(selectedRow) : null;
  const thread = selectedRow
    ? buildInquiryThread({ inquiry: selectedRow, replies })
    : [];

  return (
    <PortalShell
      title="Messages"
      description="Read and reply to contact form conversations."
      userId={session.user.id}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <MessagesInbox
        basePath="/manager/inquiries"
        folder={folder}
        items={listItems}
        selectedId={selectedId}
        selected={selected}
        thread={thread}
      />
    </PortalShell>
  );
}

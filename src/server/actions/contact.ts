"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/server/auth/guards";
import { db } from "@/server/db";
import {
  auditLogs,
  contactInquiries,
  contactInquiryReplies,
  residences,
  type ContactInquiryStatus,
} from "@/server/db/schema";
import {
  sendContactInquiryEmail,
  sendContactReplyEmail,
} from "@/server/email/resend";
import { markInquiryReadIfNew } from "@/server/queries/contact-inquiries";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  subject: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  message: z.string().trim().min(10).max(4000),
});

export type ContactFormState = {
  error?: string;
  success?: string;
};

function revalidateInbox(inquiryId?: string) {
  revalidatePath("/admin/inquiries");
  revalidatePath("/manager/inquiries");
  if (inquiryId) {
    revalidatePath(`/admin/inquiries/${inquiryId}`);
    revalidatePath(`/manager/inquiries/${inquiryId}`);
  }
}

export async function submitContactInquiryAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    subject: formData.get("subject") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      error:
        "Please enter your name, a valid email, and a message of at least 10 characters.",
    };
  }

  const [residence] = await db
    .select({
      id: residences.id,
      email: residences.email,
    })
    .from(residences)
    .where(eq(residences.slug, "victorious-residence"))
    .limit(1);

  const [inquiry] = await db
    .insert(contactInquiries)
    .values({
      residenceId: residence?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      subject: parsed.data.subject ?? null,
      message: parsed.data.message,
      status: "NEW",
    })
    .returning();

  if (!inquiry) {
    return { error: "Could not save your message. Please try again." };
  }

  const emailResult = await sendContactInquiryEmail({
    inquiryId: inquiry.id,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    subject: inquiry.subject,
    message: inquiry.message,
    notifyTo: residence?.email,
  });

  if (emailResult.ok) {
    await db
      .update(contactInquiries)
      .set({ emailSentAt: new Date() })
      .where(eq(contactInquiries.id, inquiry.id));
  } else {
    console.error("Contact inquiry email failed:", emailResult.error);
  }

  await db.insert(auditLogs).values({
    actorId: null,
    action: "contact_inquiry.create",
    entityType: "contact_inquiry",
    entityId: inquiry.id,
    metadata: {
      emailSent: emailResult.ok,
      emailError: emailResult.ok ? undefined : emailResult.error,
    },
  });

  revalidateInbox(inquiry.id);

  return {
    success: emailResult.ok
      ? "Thanks — your message was sent. We’ll get back to you soon."
      : "Thanks — your message was saved. We’ll get back to you soon.",
  };
}

export type UpdateInquiryState = {
  error?: string;
  success?: string;
};

const statusSchema = z.enum(["NEW", "READ", "ARCHIVED"]);

export async function updateContactInquiryStatusAction(
  _prev: UpdateInquiryState,
  formData: FormData,
): Promise<UpdateInquiryState> {
  const session = await requireRole("MANAGER");
  const inquiryId = String(formData.get("inquiryId") ?? "");
  const status = statusSchema.safeParse(formData.get("status"));

  if (!inquiryId || !status.success) {
    return { error: "Invalid inquiry update." };
  }

  const [updated] = await db
    .update(contactInquiries)
    .set({ status: status.data })
    .where(eq(contactInquiries.id, inquiryId))
    .returning({ id: contactInquiries.id, status: contactInquiries.status });

  if (!updated) {
    return { error: "Inquiry not found." };
  }

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "contact_inquiry.status",
    entityType: "contact_inquiry",
    entityId: updated.id,
    metadata: { status: status.data },
  });

  revalidateInbox(updated.id);
  return { success: "Status updated." };
}

/** Mark unread → read when opening from the list. Does not run on every detail render. */
export async function openContactInquiryAction(formData: FormData) {
  await requireRole("MANAGER");
  const inquiryId = String(formData.get("inquiryId") ?? "");
  const basePath = String(formData.get("basePath") ?? "/admin/inquiries");
  const folder = String(formData.get("folder") ?? "inbox");

  if (!inquiryId) {
    return;
  }

  await markInquiryReadIfNew(inquiryId);
  revalidateInbox(inquiryId);

  const params = new URLSearchParams();
  if (folder && folder !== "inbox") {
    params.set("folder", folder);
  }
  params.set("id", inquiryId);
  redirect(`${basePath}?${params.toString()}`);
}

export type ReplyInquiryState = {
  error?: string;
  success?: string;
};

const replySchema = z.object({
  inquiryId: z.string().uuid(),
  body: z.string().trim().min(1).max(8000),
});

export async function replyContactInquiryAction(
  _prev: ReplyInquiryState,
  formData: FormData,
): Promise<ReplyInquiryState> {
  const session = await requireRole("MANAGER");
  const parsed = replySchema.safeParse({
    inquiryId: formData.get("inquiryId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: "Write a reply before sending." };
  }

  const [inquiry] = await db
    .select()
    .from(contactInquiries)
    .where(eq(contactInquiries.id, parsed.data.inquiryId))
    .limit(1);

  if (!inquiry) {
    return { error: "Conversation not found." };
  }

  const emailResult = await sendContactReplyEmail({
    toEmail: inquiry.email,
    subject: inquiry.subject,
    body: parsed.data.body,
  });

  if (!emailResult.ok) {
    return {
      error: `Could not send email: ${emailResult.error}`,
    };
  }

  const [reply] = await db
    .insert(contactInquiryReplies)
    .values({
      inquiryId: inquiry.id,
      authorId: session.user.id,
      body: parsed.data.body,
      emailSentAt: new Date(),
    })
    .returning();

  if (!reply) {
    return { error: "Email sent, but the reply could not be saved." };
  }

  const nextStatus: ContactInquiryStatus =
    inquiry.status === "ARCHIVED" ? "ARCHIVED" : "READ";

  await db
    .update(contactInquiries)
    .set({ status: nextStatus })
    .where(eq(contactInquiries.id, inquiry.id));

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "contact_inquiry.reply",
    entityType: "contact_inquiry",
    entityId: inquiry.id,
    metadata: { replyId: reply.id },
  });

  revalidateInbox(inquiry.id);
  return { success: "Reply sent." };
}

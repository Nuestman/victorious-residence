import { Resend } from "resend";

import { CONTACT_EMAIL } from "@/lib/contact";

import {
  buildGuestReplyEmail,
  buildPaymentReminderEmail,
  buildStaffInquiryEmail,
} from "./templates";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function fromAddress(): string {
  const raw =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Victorious Residence <onboarding@resend.dev>";
  if (raw.includes("<") && raw.includes(">")) {
    return raw;
  }
  if (raw.includes("@")) {
    return `Victorious Residence <${raw}>`;
  }
  return raw;
}

export type ContactInquiryEmailInput = {
  inquiryId: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  notifyTo?: string | null;
};

export async function sendContactInquiryEmail(
  input: ContactInquiryEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  const to = (input.notifyTo?.trim() || CONTACT_EMAIL).trim();
  const template = buildStaffInquiryEmail(input);

  try {
    const { error } = await client.emails.send({
      from: fromAddress(),
      to: [to],
      replyTo: input.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send email.";
    return { ok: false, error: message };
  }
}

export type PaymentReminderEmailInput = {
  toEmail: string;
  residentName: string;
  roomLabel: string;
  bedLabel: string;
  roomTypeName: string;
  fullAmount: string;
  amountPaid: string;
  remaining: string;
  coverage: "unpaid" | "partial" | "full";
  bookingUrl: string;
};

export async function sendPaymentReminderEmail(
  input: PaymentReminderEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  const template = buildPaymentReminderEmail(input);

  try {
    const { error } = await client.emails.send({
      from: fromAddress(),
      to: [input.toEmail],
      replyTo: CONTACT_EMAIL,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send payment reminder.";
    return { ok: false, error: message };
  }
}

export type ContactReplyEmailInput = {
  toEmail: string;
  subject: string | null;
  body: string;
};

export async function sendContactReplyEmail(
  input: ContactReplyEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  const template = buildGuestReplyEmail({
    subject: input.subject,
    body: input.body,
  });

  try {
    const { error } = await client.emails.send({
      from: fromAddress(),
      to: [input.toEmail],
      replyTo: CONTACT_EMAIL,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send reply email.";
    return { ok: false, error: message };
  }
}

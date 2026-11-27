import { appBaseUrl } from "@/lib/app-url";
import { BRAND_NAME, BRAND_WORDMARK_SRC } from "@/lib/brand";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  getSocialLinks,
  type SocialKind,
} from "@/lib/contact";

const BRAND = BRAND_NAME;
const FOREST = "#1f3d32";
const CREAM = "#f6f1e8";
const INK = "#1c1917";
const MUTED = "#5c534c";

function brandWordmarkUrl(): string {
  return `${appBaseUrl()}${BRAND_WORDMARK_SRC}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMultilineHtml(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

/** Cream glyph on forest — `<img>` works in clients that strip inline SVG. */
function socialIconSrc(kind: SocialKind): string {
  const cream = "f6f1e8";
  switch (kind) {
    case "whatsapp":
      return `https://cdn.simpleicons.org/whatsapp/${cream}`;
    case "tiktok":
      return `https://cdn.simpleicons.org/tiktok/${cream}`;
    case "meta":
      return `https://cdn.simpleicons.org/facebook/${cream}`;
    case "instagram":
      return `https://cdn.simpleicons.org/instagram/${cream}`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function socialFooterText(): string {
  return [
    "Follow Victorious Residence",
    ...getSocialLinks().map((link) => `${link.label}: ${link.href}`),
  ].join("\n");
}

function socialFooterHtml(): string {
  const icons = getSocialLinks()
    .map(
      (link) =>
        `<a href="${escapeHtml(link.href)}" title="${escapeHtml(link.label)}" style="display:inline-block;width:36px;height:36px;margin:0 6px;border-radius:18px;background:${FOREST};text-align:center;line-height:36px;text-decoration:none;vertical-align:middle;">` +
        `<img src="${socialIconSrc(link.kind)}" width="18" height="18" alt="${escapeHtml(link.label)}" style="display:inline-block;vertical-align:middle;border:0;" />` +
        `</a>`,
    )
    .join("");

  return `
    <tr>
      <td style="padding:18px 24px 8px;text-align:center;font-family:Georgia,serif;font-size:13px;color:${MUTED};">
        Follow Victorious Residence
      </td>
    </tr>
    <tr>
      <td style="padding:0 24px 24px;text-align:center;">
        ${icons}
      </td>
    </tr>
  `;
}

function emailShell(options: {
  preheader: string;
  title: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(options.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${CREAM};color:${INK};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(options.preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:20px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;">
            <tr>
              <td style="background:${CREAM};padding:20px 24px;text-align:center;border-bottom:1px solid #ece5da;">
                <img
                  src="${escapeHtml(brandWordmarkUrl())}"
                  alt="${escapeHtml(BRAND)}"
                  width="280"
                  style="display:block;margin:0 auto;max-width:100%;height:auto;border:0;"
                />
              </td>
            </tr>
            <tr>
              <td style="padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${INK};">
                ${options.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #ece5da;padding:16px 24px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${MUTED};text-align:center;">
                ${escapeHtml(CONTACT_EMAIL)}
                <br />
                ${escapeHtml(CONTACT_PHONE)} · Obuasi, Ghana
              </td>
            </tr>
            ${socialFooterHtml()}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function emailShellText(options: { bodyText: string }): string {
  return [
    BRAND,
    "Student hostel · Obuasi",
    "----------------------------------------",
    "",
    options.bodyText,
    "",
    "----------------------------------------",
    CONTACT_EMAIL,
    `${CONTACT_PHONE} · Obuasi, Ghana`,
    "",
    socialFooterText(),
  ].join("\n");
}

export function buildStaffInquiryEmail(input: {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  inquiryId: string;
}): { subject: string; html: string; text: string } {
  const subject = input.subject?.trim()
    ? `Contact: ${input.subject.trim()}`
    : `New contact message from ${input.name}`;

  const meta = [
    `<strong>${escapeHtml(input.name)}</strong>`,
    escapeHtml(input.email),
    input.phone ? escapeHtml(input.phone) : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">
      New message
    </p>
    <p style="margin:0 0 16px;color:${MUTED};">${meta}</p>
    <p style="margin:0;">
      ${formatMultilineHtml(input.message)}
    </p>
  `;

  const bodyText = [
    `From: ${input.name}`,
    `Email: ${input.email}`,
    input.phone ? `Phone: ${input.phone}` : null,
    input.subject ? `Subject: ${input.subject}` : null,
    "",
    input.message,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return {
    subject,
    html: emailShell({
      preheader: `Message from ${input.name}`,
      title: subject,
      bodyHtml,
    }),
    text: emailShellText({ bodyText }),
  };
}

export function buildPaymentReminderEmail(input: {
  residentName: string;
  roomLabel: string;
  bedLabel: string;
  roomTypeName: string;
  fullAmount: string;
  amountPaid: string;
  remaining: string;
  coverage: "unpaid" | "partial" | "full";
  bookingUrl: string;
}): { subject: string; html: string; text: string } {
  const bed = `${input.roomLabel}-${input.bedLabel}`;
  const subject =
    input.coverage === "unpaid"
      ? `Reminder: deposit needed to reserve ${bed}`
      : `Reminder: remaining balance for ${bed}`;

  const lead =
    input.coverage === "unpaid"
      ? `This is a friendly reminder that your booking for <strong>${escapeHtml(input.roomTypeName)}</strong> (${escapeHtml(bed)}) still needs a non-refundable deposit of at least GHS 1,000 before the bed can be reserved.`
      : `This is a friendly reminder that your booking for <strong>${escapeHtml(input.roomTypeName)}</strong> (${escapeHtml(bed)}) still has a remaining balance.`;

  const bodyHtml = `
    <p style="margin:0 0 14px;">Hello ${escapeHtml(input.residentName)},</p>
    <p style="margin:0 0 14px;">${lead}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 16px;border:1px solid #ece5da;">
      <tr>
        <td style="padding:10px 12px;font-size:13px;color:${MUTED};">Full price</td>
        <td style="padding:10px 12px;text-align:right;font-weight:600;">GHS ${escapeHtml(input.fullAmount)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;font-size:13px;color:${MUTED};border-top:1px solid #ece5da;">Paid so far</td>
        <td style="padding:10px 12px;text-align:right;border-top:1px solid #ece5da;">GHS ${escapeHtml(input.amountPaid)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;font-size:13px;color:${MUTED};border-top:1px solid #ece5da;">Remaining</td>
        <td style="padding:10px 12px;text-align:right;font-weight:600;border-top:1px solid #ece5da;">GHS ${escapeHtml(input.remaining)}</td>
      </tr>
    </table>
    <p style="margin:0 0 16px;">
      <a href="${escapeHtml(input.bookingUrl)}" style="display:inline-block;background:${FOREST};color:${CREAM};text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;">
        Open your booking
      </a>
    </p>
    <p style="margin:0;font-size:13px;color:${MUTED};">
      Pay by MoMo or bank transfer, then upload your receipt in the resident portal. Reply to this email if you need help.
    </p>
  `;

  const bodyText = [
    `Hello ${input.residentName},`,
    "",
    input.coverage === "unpaid"
      ? `Reminder: your booking for ${input.roomTypeName} (${bed}) still needs a non-refundable deposit of at least GHS 1,000 before the bed can be reserved.`
      : `Reminder: your booking for ${input.roomTypeName} (${bed}) still has a remaining balance.`,
    "",
    `Full price: GHS ${input.fullAmount}`,
    `Paid so far: GHS ${input.amountPaid}`,
    `Remaining: GHS ${input.remaining}`,
    "",
    `Open your booking: ${input.bookingUrl}`,
    "",
    "Pay by MoMo or bank transfer, then upload your receipt in the resident portal.",
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader: `Balance reminder for ${bed}`,
      title: subject,
      bodyHtml,
    }),
    text: emailShellText({ bodyText }),
  };
}

export function buildGuestReplyEmail(input: {
  subject: string | null;
  body: string;
}): { subject: string; html: string; text: string } {
  // Subject stays "Re: …" so clients can thread. Body is only the new reply —
  // do not quote/attach prior messages; clients handle that themselves.
  const subject = input.subject?.trim()
    ? `Re: ${input.subject.trim()}`
    : "Re: your message to Victorious Residence";

  const bodyHtml = `
    <p style="margin:0;">
      ${formatMultilineHtml(input.body)}
    </p>
  `;

  return {
    subject,
    html: emailShell({
      preheader: `Reply from ${BRAND}`,
      title: subject,
      bodyHtml,
    }),
    text: emailShellText({ bodyText: input.body }),
  };
}

export const CONTACT_PHONE = "0248623408 · 0500389203";

export const CONTACT_EMAIL = "victoriousresidence@gmail.com";

export const CONTACT_WHATSAPP_PHONE = "0248623408";

/** Update these when the hostel’s real social pages are ready. */
export const CONTACT_TIKTOK_URL =
  "https://www.tiktok.com/@victoriousresidence";

export const CONTACT_META_URL =
  "https://www.facebook.com/victoriousresidence";

export const CONTACT_INSTAGRAM_URL =
  "https://www.instagram.com/victoriousresidence";

export const LEGACY_PLACEHOLDER_PHONE = "Placeholder phone — replace";

export const LEGACY_PLACEHOLDER_EMAIL = "placeholder@victorious.local";

export type SocialKind = "whatsapp" | "tiktok" | "meta" | "instagram";

export type SocialLink = {
  kind: SocialKind;
  label: string;
  href: string;
};

export function toInternationalPhone(local: string): string {
  const digits = local.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    return `233${digits.slice(1)}`;
  }
  if (digits.startsWith("233")) {
    return digits;
  }
  return digits;
}

export function whatsappHref(local: string): string {
  return `https://wa.me/${toInternationalPhone(local)}`;
}

export function getSocialLinks(): SocialLink[] {
  return [
    {
      kind: "whatsapp",
      label: "WhatsApp",
      href: whatsappHref(CONTACT_WHATSAPP_PHONE),
    },
    {
      kind: "tiktok",
      label: "TikTok",
      href: CONTACT_TIKTOK_URL,
    },
    {
      kind: "meta",
      label: "Facebook",
      href: CONTACT_META_URL,
    },
    {
      kind: "instagram",
      label: "Instagram",
      href: CONTACT_INSTAGRAM_URL,
    },
  ];
}

export function splitContactPhones(phone: string | null | undefined): string[] {
  if (!phone) {
    return [];
  }
  return phone
    .split(/[·,|/]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function telHref(local: string): string {
  const digits = toInternationalPhone(local);
  return `tel:+${digits}`;
}

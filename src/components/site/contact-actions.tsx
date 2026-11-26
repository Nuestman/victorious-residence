import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_WHATSAPP_PHONE,
  getSocialLinks,
  splitContactPhones,
  telHref,
  type SocialKind,
} from "@/lib/contact";

type ActionTone = "ink" | "cream";

type ContactAction = {
  key: string;
  label: string;
  href: string;
  kind: SocialKind | "phone" | "email";
  external?: boolean;
};

function ActionIcon({
  kind,
  className = "h-4 w-4",
}: {
  kind: ContactAction["kind"];
  className?: string;
}) {
  switch (kind) {
    case "phone":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.5 4.5h3l1.2 3.2-1.8 1.1a12 12 0 0 0 5.3 5.3l1.1-1.8 3.2 1.2v3a1.5 1.5 0 0 1-1.6 1.5A14.5 14.5 0 0 1 5 6.1a1.5 1.5 0 0 1 1.5-1.6z"
          />
        </svg>
      );
    case "email":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M12.04 2a9.9 9.9 0 0 0-8.5 14.94L2 22l5.2-1.48A9.9 9.9 0 1 0 12.04 2zm0 1.8a8.1 8.1 0 0 1 6.9 12.3l-.3.46.32 1.9-1.95-.35-.44.27a8.1 8.1 0 1 1-4.53-14.58zm4.7 10.36c-.2-.1-1.2-.6-1.38-.66-.19-.07-.33-.1-.47.1-.14.2-.54.66-.66.8-.12.13-.24.15-.45.05-.2-.1-.86-.32-1.63-1.01-.6-.53-1-1.2-1.12-1.4-.12-.2-.01-.31.09-.41.09-.09.2-.24.3-.36.1-.12.13-.2.2-.34.06-.13.03-.25-.02-.35-.05-.1-.47-1.13-.64-1.55-.17-.4-.34-.35-.47-.35h-.4c-.14 0-.35.05-.54.25-.19.2-.71.7-.71 1.7 0 1 .73 1.97.83 2.1.1.14 1.44 2.2 3.5 3.08.49.21.87.34 1.17.43.49.15.94.13 1.3.08.4-.06 1.2-.49 1.37-.96.17-.47.17-.87.12-.96-.05-.08-.19-.14-.4-.24z"
          />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M16.5 3c.4 2.4 1.9 4 4.3 4.3v2.5c-1.5 0-2.9-.5-4.1-1.3v6.4a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.7a3 3 0 1 0 2.1 2.9V3h2.5z"
          />
        </svg>
      );
    case "meta":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M14 8h2.5V5.5H14c-2.1 0-3.5 1.5-3.5 3.7V12H8v2.5h2.5V22H14v-7.5h2.3L17 12h-3V9.5c0-.8.3-1.5 1-1.5z"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm0 1.8A3.2 3.2 0 0 0 4.8 8v8A3.2 3.2 0 0 0 8 19.2h8A3.2 3.2 0 0 0 19.2 16V8A3.2 3.2 0 0 0 16 4.8H8zm8.4 1.5a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2zM12 8.2A3.8 3.8 0 1 1 12 15.8 3.8 3.8 0 0 1 12 8.2zm0 1.8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
          />
        </svg>
      );
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

function getDirectActions(): ContactAction[] {
  return [
    ...splitContactPhones(CONTACT_PHONE).map((number) => ({
      key: `phone-${number}`,
      label: number,
      href: telHref(number),
      kind: "phone" as const,
    })),
    {
      key: "email",
      label: CONTACT_EMAIL,
      href: `mailto:${CONTACT_EMAIL}`,
      kind: "email",
    },
  ];
}

function getSocialActions(): ContactAction[] {
  return getSocialLinks().map((link) => ({
    key: link.kind,
    label:
      link.kind === "whatsapp"
        ? `WhatsApp ${CONTACT_WHATSAPP_PHONE}`
        : link.label,
    href: link.href,
    kind: link.kind,
    external: true,
  }));
}

function toneClass(tone: ActionTone) {
  return tone === "cream"
    ? "border-cream/25 text-cream hover:border-brass hover:text-brass"
    : "border-ink/15 text-ink hover:border-forest hover:text-forest";
}

export function ContactActions({
  tone = "ink",
  includeSocial = true,
}: {
  tone?: ActionTone;
  includeSocial?: boolean;
}) {
  const direct = getDirectActions();
  const social = includeSocial ? getSocialActions() : [];
  const itemClass = toneClass(tone);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {direct.map((action) => (
          <a
            key={action.key}
            href={action.href}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${itemClass}`}
          >
            <ActionIcon kind={action.kind} className="h-5 w-5 shrink-0" />
            <span className="break-all">{action.label}</span>
          </a>
        ))}
      </div>
      {social.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {social.map((action) => (
            <a
              key={action.key}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={action.label}
              title={action.label}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-md border ${itemClass}`}
            >
              <ActionIcon kind={action.kind} className="h-6 w-6" />
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

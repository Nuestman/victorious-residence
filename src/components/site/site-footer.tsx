import Link from "next/link";

import { BrandLogo } from "./brand-logo";
import { ContactActions } from "./contact-actions";

type SiteFooterProps = {
  name: string;
  address: string;
};

const links = [
  { href: "/rooms", label: "Rooms" },
  { href: "/facilities", label: "Facilities" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Sign in" },
] as const;

export function SiteFooter({ name, address }: SiteFooterProps) {
  return (
    <footer className="mt-auto border-t border-ink/10 bg-forest text-cream">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <BrandLogo name={name} size="md" tone="forest" />
          <p className="text-sm text-cream/80">{address}</p>
          <div className="pt-1">
            <p className="mb-2 text-xs tracking-[0.14em] text-cream/60 uppercase">
              Reach us
            </p>
            <ContactActions tone="cream" />
          </div>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brass">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-cream/75">
          A student hostel in Obuasi — calm rooms, shared kitchen and study
          space, and Wi-Fi throughout. Browse rooms online and apply when you
          are ready to settle in.
        </p>
      </div>
      <div className="border-t border-cream/15 px-4 py-4 text-center text-xs text-cream/70 sm:px-6">
        © 2026 {name}
      </div>
    </footer>
  );
}

import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/contact";
import { auth } from "@/server/auth";
import { defaultDestinationForRole } from "@/server/auth/roles";
import { getPublicShowcase } from "@/server/queries/showcase";

import { PublicHeader } from "./public-header";
import { SiteFooter } from "./site-footer";

export async function PublicChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const showcase = await getPublicShowcase();
  const session = await auth();
  const residence = showcase?.residence;
  const name = residence?.name ?? "Victorious Residence";
  const address = residence?.address ?? "Obuasi, Ghana";
  const portalHref = session?.user
    ? defaultDestinationForRole(session.user.role)
    : null;
  const user = session?.user
    ? {
        name: session.user.name || "Resident",
        email: session.user.email,
        role: session.user.role,
      }
    : null;

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-cream text-ink">
      <PublicHeader
        name={name}
        address={address}
        phone={CONTACT_PHONE}
        email={CONTACT_EMAIL}
        user={user}
        portalHref={portalHref}
      />
      <div className="flex-1">{children}</div>
      <SiteFooter name={name} address={address} />
    </div>
  );
}

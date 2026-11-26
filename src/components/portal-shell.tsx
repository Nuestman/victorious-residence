import { AppChrome } from "@/components/app-chrome";
import { portalLinksForRole } from "@/components/portal-nav";
import type { UserRole } from "@/server/db/schema";

type PortalShellProps = {
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  children?: React.ReactNode;
};

export function PortalShell({
  title,
  description,
  userName,
  userEmail,
  role,
  children,
}: PortalShellProps) {
  return (
    <AppChrome
      title={title}
      description={description}
      userName={userName}
      userEmail={userEmail}
      role={role}
      links={portalLinksForRole(role)}
    >
      {children}
    </AppChrome>
  );
}

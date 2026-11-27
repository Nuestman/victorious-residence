import { AppChrome } from "@/components/app-chrome";
import { portalLinksForRole } from "@/components/portal-nav";
import type { UserRole } from "@/server/db/schema";
import { getUserAvatarUrl } from "@/server/queries/profile";

type PortalShellProps = {
  title: string;
  description: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  children?: React.ReactNode;
};

export async function PortalShell({
  title,
  description,
  userId,
  userName,
  userEmail,
  role,
  children,
}: PortalShellProps) {
  const userImageUrl = await getUserAvatarUrl(userId);

  return (
    <AppChrome
      title={title}
      description={description}
      userName={userName}
      userEmail={userEmail}
      userImageUrl={userImageUrl}
      role={role}
      links={portalLinksForRole(role)}
    >
      {children}
    </AppChrome>
  );
}

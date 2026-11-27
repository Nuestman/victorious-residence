import { PortalShell } from "@/components/portal-shell";
import {
  ProfileAvatarForm,
  ProfileDetailsForm,
  ProfilePasswordForm,
} from "@/components/profile/profile-forms";
import { requireSession } from "@/server/auth/guards";
import { getUserProfile } from "@/server/queries/profile";

export const instant = false;

export default async function ProfilePage() {
  const session = await requireSession("/profile");
  const profile = await getUserProfile(session.user.id);

  if (!profile) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-ink/70">Account not found.</p>
      </main>
    );
  }

  return (
    <PortalShell
      title="Your profile"
      description={
        profile.role === "RESIDENT"
          ? "Update your details, ID card photos, profile photo, and password. Managers use these when verifying residents."
          : "Update your details, profile photo, and password."
      }
      userId={session.user.id}
      userName={profile.fullName}
      userEmail={profile.email}
      role={profile.role}
    >
      <div className="grid gap-10 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-forest/20 bg-white p-5">
          <h2 className="font-display text-2xl text-ink">Photo</h2>
          <ProfileAvatarForm user={profile} />
        </section>

        <section className="space-y-3 rounded-lg border border-ink/10 bg-white p-5">
          <h2 className="font-display text-2xl text-ink">Password</h2>
          <ProfilePasswordForm />
        </section>

        <section className="space-y-3 rounded-lg border border-ink/10 bg-white p-5 lg:col-span-2">
          <h2 className="font-display text-2xl text-ink">Personal details</h2>
          <ProfileDetailsForm user={profile} />
        </section>
      </div>
    </PortalShell>
  );
}

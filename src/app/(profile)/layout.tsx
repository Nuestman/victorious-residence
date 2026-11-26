import { Suspense } from "react";

export const instant = false;

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-ink/60">Loading profile…</p>}>
      {children}
    </Suspense>
  );
}

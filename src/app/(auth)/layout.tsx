import { PublicChrome } from "@/components/site/public-chrome";
import { getPublicShowcase } from "@/server/queries/showcase";

export const instant = false;

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const showcase = await getPublicShowcase();
  const hero = showcase?.residence.heroImageUrl ?? "/showcase/exterior-day.jpg";
  const name = showcase?.residence.name ?? "Victorious Residence";

  return (
    <PublicChrome>
      <div className="grid lg:min-h-[70vh] lg:grid-cols-2">
        <div className="relative hidden min-h-[28rem] lg:block">
          <img
            src={hero}
            alt={`${name} exterior`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="flex items-center px-4 py-12 sm:px-6">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </div>
    </PublicChrome>
  );
}

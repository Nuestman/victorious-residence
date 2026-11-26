import { splitContactPhones, telHref } from "@/lib/contact";

export function ContactPhoneLinks({
  phone,
  className,
}: {
  phone: string | null;
  className?: string;
}) {
  const numbers = splitContactPhones(phone);
  if (numbers.length === 0) {
    return <span className={className}>Phone not listed yet</span>;
  }

  return (
    <span className={className}>
      {numbers.map((number, index) => (
        <span key={number}>
          {index > 0 ? " · " : null}
          <a href={telHref(number)} className="hover:text-brass">
            {number}
          </a>
        </span>
      ))}
    </span>
  );
}

export function ContactEmailLink({
  email,
  className,
}: {
  email: string | null;
  className?: string;
}) {
  if (!email) {
    return <span className={className}>Email not listed yet</span>;
  }
  return (
    <a href={`mailto:${email}`} className={className ?? "hover:text-brass"}>
      {email}
    </a>
  );
}

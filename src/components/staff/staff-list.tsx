import Link from "next/link";

import { UserAvatar } from "@/components/site/user-avatar";

type StaffRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl?: string | null;
  role: string;
  residenceName: string | null;
};

type StaffListProps = {
  staff: StaffRow[];
  basePath: "/admin/staff" | "/manager/staff";
};

export function StaffList({ staff, basePath }: StaffListProps) {
  if (staff.length === 0) {
    return (
      <p className="border border-stone-200 px-4 py-6 text-sm text-stone-600">
        No staff accounts yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 border border-stone-200">
      {staff.map((member) => (
        <li
          key={member.id}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar
              name={member.fullName}
              imageUrl={member.avatarUrl}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="font-medium text-stone-900">{member.fullName}</p>
              <p className="text-sm text-stone-500">
                {member.role}
                {member.residenceName ? ` · ${member.residenceName}` : ""} ·{" "}
                {member.email}
                {member.phone ? ` · ${member.phone}` : ""}
              </p>
            </div>
          </div>
          <Link
            href={`${basePath}/${member.id}`}
            className="text-sm font-medium text-stone-800 underline"
          >
            Edit
          </Link>
        </li>
      ))}
    </ul>
  );
}

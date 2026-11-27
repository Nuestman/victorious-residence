import { db } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

export type AuditWriteInput = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

/** Persist a staff/resident/system action for the admin audit trail. */
export async function writeAuditLog(input: AuditWriteInput): Promise<void> {
  await db.insert(auditLogs).values({
    actorId: input.actorId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ?? {},
  });
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.logout": "Signed out",
  "auth.register": "Registered account",
  "booking.application": "Started booking application",
  "booking.deposit_proof": "Submitted deposit proof",
  "booking.approve": "Approved booking",
  "booking.reject": "Rejected booking",
  "booking.cancel": "Cancelled booking / residence",
  "booking.upgrade": "Upgraded / moved room",
  "booking.expire": "Booking expired",
  "booking.expire_cron": "Booking expired (cron)",
  "booking.expire_on_view": "Booking expired (view)",
  "booking.expire_on_manager_view": "Booking expired (manager view)",
  "booking.expire_on_manager_queue": "Booking expired (queue)",
  "booking.expire_before_approve": "Booking expired before approve",
  "system.auto_expire_on_submit": "Booking expired on submit",
  "booking.payment_reminder": "Sent payment reminder",
  "profile.update": "Updated profile",
  "profile.password_change": "Changed password",
  "profile.avatar_update": "Updated profile photo",
  "profile.avatar_remove": "Removed profile photo",
  "staff.create": "Created staff account",
  "staff.update": "Updated staff account",
  "residence.create": "Created residence",
  "residence.update": "Updated residence",
  "residence.media": "Updated residence media",
  "admin.residence_switch": "Switched working campus",
  "room_type.create": "Created room type",
  "room_type.update": "Updated room type",
  "rooms.provision": "Provisioned rooms",
  "contact_inquiry.create": "Submitted contact message",
  "contact_inquiry.status": "Updated inquiry status",
  "contact_inquiry.reply": "Replied to inquiry",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

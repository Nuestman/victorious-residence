import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "RESIDENT",
  "STAFF",
  "MANAGER",
  "ADMIN",
]);

export const bedSpaceStatusEnum = pgEnum("bed_space_status", [
  "AVAILABLE",
  "PENDING_PAYMENT",
  "OCCUPIED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUCCESS",
  "FAILED",
]);

export const residenceMediaKindEnum = pgEnum("residence_media_kind", [
  "EXTERIOR",
  "FACILITY",
]);

export const residences = pgTable(
  "residences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    address: text("address").notNull(),
    description: text("description"),
    phone: text("phone"),
    email: text("email"),
    heroImageUrl: text("hero_image_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("residences_slug_uidx").on(table.slug)],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    nationalId: text("national_id"),
    /** Ghana Card / national ID scan (data URL until object storage). */
    nationalIdImageUrl: text("national_id_image_url"),
    studentId: text("student_id"),
    /** Student ID card scan (data URL until object storage). */
    studentIdImageUrl: text("student_id_image_url"),
    hometown: text("hometown"),
    emergencyContactName: text("emergency_contact_name"),
    emergencyContactPhone: text("emergency_contact_phone"),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").notNull().default("RESIDENT"),
    residenceId: uuid("residence_id").references(() => residences.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("users_email_uidx").on(table.email),
    index("users_role_idx").on(table.role),
    index("users_residence_id_idx").on(table.residenceId),
  ],
);

export const residenceMedia = pgTable(
  "residence_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    residenceId: uuid("residence_id")
      .notNull()
      .references(() => residences.id, { onDelete: "cascade" }),
    kind: residenceMediaKindEnum("kind").notNull().default("EXTERIOR"),
    title: text("title"),
    description: text("description"),
    url: text("url").notNull(),
    caption: text("caption"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("residence_media_residence_id_idx").on(table.residenceId),
  ],
);

export const roomTypes = pgTable(
  "room_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    residenceId: uuid("residence_id")
      .notNull()
      .references(() => residences.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    capacity: integer("capacity").notNull(),
    pricePerBed: numeric("price_per_bed", { precision: 12, scale: 2 }).notNull(),
    description: text("description"),
    amenities: jsonb("amenities").$type<string[]>().default([]),
    coverImageUrl: text("cover_image_url"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("room_types_residence_name_uidx").on(
      table.residenceId,
      table.name,
    ),
    index("room_types_residence_active_idx").on(
      table.residenceId,
      table.isActive,
    ),
  ],
);

export const roomTypeMedia = pgTable(
  "room_type_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    caption: text("caption"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("room_type_media_room_type_id_idx").on(table.roomTypeId),
  ],
);

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    residenceId: uuid("residence_id")
      .notNull()
      .references(() => residences.id, { onDelete: "cascade" }),
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "restrict" }),
    label: text("label").notNull(),
    floor: integer("floor"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("rooms_residence_label_uidx").on(
      table.residenceId,
      table.label,
    ),
    index("rooms_residence_type_active_idx").on(
      table.residenceId,
      table.roomTypeId,
      table.isActive,
    ),
  ],
);

export const bedSpaces = pgTable(
  "bed_spaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    status: bedSpaceStatusEnum("status").notNull().default("AVAILABLE"),
    activeBookingId: uuid("active_booking_id").references(
      (): AnyPgColumn => bookings.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("bed_spaces_room_label_uidx").on(table.roomId, table.label),
    index("bed_spaces_room_status_idx").on(table.roomId, table.status),
    index("bed_spaces_status_idx").on(table.status),
    index("bed_spaces_available_idx")
      .on(table.status)
      .where(sql`${table.status} = 'AVAILABLE'`),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    residentId: uuid("resident_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    bedSpaceId: uuid("bed_space_id")
      .notNull()
      .references(() => bedSpaces.id, { onDelete: "restrict" }),
    residenceId: uuid("residence_id")
      .notNull()
      .references(() => residences.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    /** Declared partial/full payment on the uploaded receipt (GHS). */
    amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }),
    paymentReference: text("payment_reference"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("PENDING"),
    receiptUrl: text("receipt_url"),
    /** Soft abandon deadline for unpaid applications (no inventory lock). */
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("bookings_payment_status_expires_idx").on(
      table.paymentStatus,
      table.expiresAt,
    ),
    index("bookings_residence_payment_status_idx").on(
      table.residenceId,
      table.paymentStatus,
    ),
    index("bookings_resident_created_idx").on(
      table.residentId,
      table.createdAt,
    ),
    index("bookings_bed_space_payment_status_idx").on(
      table.bedSpaceId,
      table.paymentStatus,
    ),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export const contactInquiryStatusEnum = pgEnum("contact_inquiry_status", [
  "NEW",
  "READ",
  "ARCHIVED",
]);

export const contactInquiries = pgTable(
  "contact_inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    residenceId: uuid("residence_id").references(() => residences.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    subject: text("subject"),
    message: text("message").notNull(),
    status: contactInquiryStatusEnum("status").notNull().default("NEW"),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("contact_inquiries_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    index("contact_inquiries_residence_created_idx").on(
      table.residenceId,
      table.createdAt,
    ),
  ],
);

export const contactInquiryReplies = pgTable(
  "contact_inquiry_replies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inquiryId: uuid("inquiry_id")
      .notNull()
      .references(() => contactInquiries.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("contact_inquiry_replies_inquiry_created_idx").on(
      table.inquiryId,
      table.createdAt,
    ),
  ],
);

export const residencesRelations = relations(residences, ({ many }) => ({
  users: many(users),
  media: many(residenceMedia),
  roomTypes: many(roomTypes),
  rooms: many(rooms),
  bookings: many(bookings),
  contactInquiries: many(contactInquiries),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  residence: one(residences, {
    fields: [users.residenceId],
    references: [residences.id],
  }),
  bookings: many(bookings, { relationName: "residentBookings" }),
  reviews: many(bookings, { relationName: "reviewedBookings" }),
}));

export const residenceMediaRelations = relations(residenceMedia, ({ one }) => ({
  residence: one(residences, {
    fields: [residenceMedia.residenceId],
    references: [residences.id],
  }),
}));

export const roomTypesRelations = relations(roomTypes, ({ one, many }) => ({
  residence: one(residences, {
    fields: [roomTypes.residenceId],
    references: [residences.id],
  }),
  rooms: many(rooms),
  media: many(roomTypeMedia),
}));

export const roomTypeMediaRelations = relations(roomTypeMedia, ({ one }) => ({
  roomType: one(roomTypes, {
    fields: [roomTypeMedia.roomTypeId],
    references: [roomTypes.id],
  }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  residence: one(residences, {
    fields: [rooms.residenceId],
    references: [residences.id],
  }),
  roomType: one(roomTypes, {
    fields: [rooms.roomTypeId],
    references: [roomTypes.id],
  }),
  bedSpaces: many(bedSpaces),
}));

export const bedSpacesRelations = relations(bedSpaces, ({ one, many }) => ({
  room: one(rooms, {
    fields: [bedSpaces.roomId],
    references: [rooms.id],
  }),
  activeBooking: one(bookings, {
    fields: [bedSpaces.activeBookingId],
    references: [bookings.id],
    relationName: "activeBedBooking",
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  resident: one(users, {
    fields: [bookings.residentId],
    references: [users.id],
    relationName: "residentBookings",
  }),
  reviewer: one(users, {
    fields: [bookings.reviewedById],
    references: [users.id],
    relationName: "reviewedBookings",
  }),
  bedSpace: one(bedSpaces, {
    fields: [bookings.bedSpaceId],
    references: [bedSpaces.id],
  }),
  residence: one(residences, {
    fields: [bookings.residenceId],
    references: [residences.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

export const contactInquiriesRelations = relations(
  contactInquiries,
  ({ one, many }) => ({
    residence: one(residences, {
      fields: [contactInquiries.residenceId],
      references: [residences.id],
    }),
    replies: many(contactInquiryReplies),
  }),
);

export const contactInquiryRepliesRelations = relations(
  contactInquiryReplies,
  ({ one }) => ({
    inquiry: one(contactInquiries, {
      fields: [contactInquiryReplies.inquiryId],
      references: [contactInquiries.id],
    }),
    author: one(users, {
      fields: [contactInquiryReplies.authorId],
      references: [users.id],
    }),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Residence = typeof residences.$inferSelect;
export type RoomType = typeof roomTypes.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type BedSpace = typeof bedSpaces.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type ContactInquiryReply = typeof contactInquiryReplies.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type BedSpaceStatus = (typeof bedSpaceStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type ResidenceMediaKind =
  (typeof residenceMediaKindEnum.enumValues)[number];
export type ContactInquiryStatus =
  (typeof contactInquiryStatusEnum.enumValues)[number];

/** Tracks applied data/seed migrations (separate from Drizzle schema migrations). */
export const seedMigrations = pgTable("seed_migrations", {
  id: text("id").primaryKey(),
  appliedAt: timestamp("applied_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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

export const residences = pgTable(
  "residences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    address: text("address").notNull(),
    description: text("description"),
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
    paymentReference: text("payment_reference"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("PENDING"),
    receiptUrl: text("receipt_url"),
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

export const residencesRelations = relations(residences, ({ many }) => ({
  users: many(users),
  media: many(residenceMedia),
  roomTypes: many(roomTypes),
  rooms: many(rooms),
  bookings: many(bookings),
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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Residence = typeof residences.$inferSelect;
export type RoomType = typeof roomTypes.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type BedSpace = typeof bedSpaces.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type BedSpaceStatus = (typeof bedSpaceStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

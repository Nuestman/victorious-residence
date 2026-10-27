CREATE TYPE "public"."bed_space_status" AS ENUM('AVAILABLE', 'PENDING_PAYMENT', 'OCCUPIED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'SUCCESS', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('RESIDENT', 'MANAGER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bed_spaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"label" text NOT NULL,
	"status" "bed_space_status" DEFAULT 'AVAILABLE' NOT NULL,
	"active_booking_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resident_id" uuid NOT NULL,
	"bed_space_id" uuid NOT NULL,
	"residence_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_reference" text,
	"payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"receipt_url" text,
	"expires_at" timestamp with time zone NOT NULL,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "residence_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"residence_id" uuid NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "residences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"address" text NOT NULL,
	"description" text,
	"hero_image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"residence_id" uuid NOT NULL,
	"name" text NOT NULL,
	"capacity" integer NOT NULL,
	"price_per_bed" numeric(12, 2) NOT NULL,
	"description" text,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"cover_image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"residence_id" uuid NOT NULL,
	"room_type_id" uuid NOT NULL,
	"label" text NOT NULL,
	"floor" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"role" "user_role" DEFAULT 'RESIDENT' NOT NULL,
	"residence_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_spaces" ADD CONSTRAINT "bed_spaces_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_spaces" ADD CONSTRAINT "bed_spaces_active_booking_id_bookings_id_fk" FOREIGN KEY ("active_booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_resident_id_users_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_bed_space_id_bed_spaces_id_fk" FOREIGN KEY ("bed_space_id") REFERENCES "public"."bed_spaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_residence_id_residences_id_fk" FOREIGN KEY ("residence_id") REFERENCES "public"."residences"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residence_media" ADD CONSTRAINT "residence_media_residence_id_residences_id_fk" FOREIGN KEY ("residence_id") REFERENCES "public"."residences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_residence_id_residences_id_fk" FOREIGN KEY ("residence_id") REFERENCES "public"."residences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_residence_id_residences_id_fk" FOREIGN KEY ("residence_id") REFERENCES "public"."residences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_residence_id_residences_id_fk" FOREIGN KEY ("residence_id") REFERENCES "public"."residences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bed_spaces_room_label_uidx" ON "bed_spaces" USING btree ("room_id","label");--> statement-breakpoint
CREATE INDEX "bed_spaces_room_status_idx" ON "bed_spaces" USING btree ("room_id","status");--> statement-breakpoint
CREATE INDEX "bed_spaces_status_idx" ON "bed_spaces" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bed_spaces_available_idx" ON "bed_spaces" USING btree ("status") WHERE "bed_spaces"."status" = 'AVAILABLE';--> statement-breakpoint
CREATE INDEX "bookings_payment_status_expires_idx" ON "bookings" USING btree ("payment_status","expires_at");--> statement-breakpoint
CREATE INDEX "bookings_residence_payment_status_idx" ON "bookings" USING btree ("residence_id","payment_status");--> statement-breakpoint
CREATE INDEX "bookings_resident_created_idx" ON "bookings" USING btree ("resident_id","created_at");--> statement-breakpoint
CREATE INDEX "bookings_bed_space_payment_status_idx" ON "bookings" USING btree ("bed_space_id","payment_status");--> statement-breakpoint
CREATE INDEX "residence_media_residence_id_idx" ON "residence_media" USING btree ("residence_id");--> statement-breakpoint
CREATE UNIQUE INDEX "residences_slug_uidx" ON "residences" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "room_types_residence_name_uidx" ON "room_types" USING btree ("residence_id","name");--> statement-breakpoint
CREATE INDEX "room_types_residence_active_idx" ON "room_types" USING btree ("residence_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_residence_label_uidx" ON "rooms" USING btree ("residence_id","label");--> statement-breakpoint
CREATE INDEX "rooms_residence_type_active_idx" ON "rooms" USING btree ("residence_id","room_type_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uidx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_residence_id_idx" ON "users" USING btree ("residence_id");
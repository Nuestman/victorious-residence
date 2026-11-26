CREATE TYPE "public"."residence_media_kind" AS ENUM('EXTERIOR', 'FACILITY');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'STAFF' BEFORE 'MANAGER';--> statement-breakpoint
CREATE TABLE "room_type_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_type_id" uuid NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "residence_media" ADD COLUMN "kind" "residence_media_kind" DEFAULT 'EXTERIOR' NOT NULL;--> statement-breakpoint
ALTER TABLE "residence_media" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "residence_media" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "residences" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "residences" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "room_type_media" ADD CONSTRAINT "room_type_media_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "room_type_media_room_type_id_idx" ON "room_type_media" USING btree ("room_type_id");
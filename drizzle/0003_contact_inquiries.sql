CREATE TYPE "public"."contact_inquiry_status" AS ENUM('NEW', 'READ', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "contact_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"residence_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"subject" text,
	"message" text NOT NULL,
	"status" "contact_inquiry_status" DEFAULT 'NEW' NOT NULL,
	"email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_inquiries" ADD CONSTRAINT "contact_inquiries_residence_id_residences_id_fk" FOREIGN KEY ("residence_id") REFERENCES "public"."residences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_inquiries_status_created_idx" ON "contact_inquiries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "contact_inquiries_residence_created_idx" ON "contact_inquiries" USING btree ("residence_id","created_at");
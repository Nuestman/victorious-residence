ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "national_id_image_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "student_id_image_url" text;

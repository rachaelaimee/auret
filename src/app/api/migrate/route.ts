import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// This is a one-time migration endpoint to create craft room tables
export async function POST() {
  try {
    // Create the craft room tables if they don't exist
    await db.execute(sql`
      -- Create enums if they don't exist
      DO $$ BEGIN
        CREATE TYPE "craft_room_status" AS ENUM('active', 'paused', 'ended');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "participant_role" AS ENUM('host', 'moderator', 'participant');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- Create craft_rooms table
      CREATE TABLE IF NOT EXISTS "craft_rooms" (
        "id" text PRIMARY KEY NOT NULL,
        "host_id" text NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "tags_text" text,
        "max_participants" integer DEFAULT 8,
        "is_public" boolean DEFAULT true,
        "requires_approval" boolean DEFAULT false,
        "status" "craft_room_status" DEFAULT 'active' NOT NULL,
        "daily_room_name" varchar(255),
        "daily_room_url" text,
        "scheduled_start_at" timestamp,
        "actual_started_at" timestamp,
        "ended_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      -- Create craft_room_participants table
      CREATE TABLE IF NOT EXISTS "craft_room_participants" (
        "id" text PRIMARY KEY NOT NULL,
        "room_id" text NOT NULL,
        "user_id" text NOT NULL,
        "role" "participant_role" DEFAULT 'participant' NOT NULL,
        "joined_at" timestamp DEFAULT now() NOT NULL,
        "left_at" timestamp,
        "is_video_enabled" boolean DEFAULT true,
        "is_audio_enabled" boolean DEFAULT true,
        "is_banned" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      -- Create craft_room_messages table
      CREATE TABLE IF NOT EXISTS "craft_room_messages" (
        "id" text PRIMARY KEY NOT NULL,
        "room_id" text NOT NULL,
        "sender_id" text NOT NULL,
        "content" text NOT NULL,
        "message_type" varchar(20) DEFAULT 'text',
        "metadata" jsonb,
        "is_deleted" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS "craft_rooms_host_idx" ON "craft_rooms" ("host_id");
      CREATE INDEX IF NOT EXISTS "craft_rooms_status_idx" ON "craft_rooms" ("status");
      CREATE INDEX IF NOT EXISTS "craft_rooms_public_idx" ON "craft_rooms" ("is_public");
      CREATE INDEX IF NOT EXISTS "craft_rooms_tags_idx" ON "craft_rooms" ("tags_text");
      CREATE INDEX IF NOT EXISTS "craft_rooms_daily_room_idx" ON "craft_rooms" ("daily_room_name");

      CREATE UNIQUE INDEX IF NOT EXISTS "craft_room_participants_room_user_idx" ON "craft_room_participants" ("room_id","user_id");
      CREATE INDEX IF NOT EXISTS "craft_room_participants_room_idx" ON "craft_room_participants" ("room_id");
      CREATE INDEX IF NOT EXISTS "craft_room_participants_user_idx" ON "craft_room_participants" ("user_id");

      CREATE INDEX IF NOT EXISTS "craft_room_messages_room_idx" ON "craft_room_messages" ("room_id");
      CREATE INDEX IF NOT EXISTS "craft_room_messages_sender_idx" ON "craft_room_messages" ("sender_id");
      CREATE INDEX IF NOT EXISTS "craft_room_messages_type_idx" ON "craft_room_messages" ("message_type");

      -- Add foreign key constraints if they don't exist
      DO $$ BEGIN
        ALTER TABLE "craft_rooms" ADD CONSTRAINT "craft_rooms_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "craft_room_participants" ADD CONSTRAINT "craft_room_participants_room_id_craft_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "craft_rooms"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "craft_room_participants" ADD CONSTRAINT "craft_room_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "craft_room_messages" ADD CONSTRAINT "craft_room_messages_room_id_craft_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "craft_rooms"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "craft_room_messages" ADD CONSTRAINT "craft_room_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    return NextResponse.json({
      success: true,
      message: "Craft room tables created successfully"
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create tables",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

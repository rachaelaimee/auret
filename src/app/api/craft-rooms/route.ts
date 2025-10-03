import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { craftRooms, craftRoomParticipants } from "@/lib/db/schema";
import { verifyIdToken } from "@/lib/firebase-admin";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { eq, and, desc } from "drizzle-orm";

const createRoomSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  tags: z.string().optional(),
  maxParticipants: z.number().min(2).max(50).default(8),
  isPublic: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
  scheduledStartAt: z.string().datetime().optional(),
});

// GET /api/craft-rooms - List active craft rooms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");
    const tags = searchParams.get("tags");

    let query = db
      .select({
        id: craftRooms.id,
        title: craftRooms.title,
        description: craftRooms.description,
        tags: craftRooms.tags,
        maxParticipants: craftRooms.maxParticipants,
        isPublic: craftRooms.isPublic,
        status: craftRooms.status,
        hostId: craftRooms.hostId,
        participantCount: craftRoomParticipants.id, // We'll count this
        createdAt: craftRooms.createdAt,
        scheduledStartAt: craftRooms.scheduledStartAt,
      })
      .from(craftRooms)
      .leftJoin(
        craftRoomParticipants,
        and(
          eq(craftRoomParticipants.roomId, craftRooms.id),
          eq(craftRoomParticipants.leftAt, null) // Only active participants
        )
      )
      .where(eq(craftRooms.status, "active"))
      .orderBy(desc(craftRooms.createdAt))
      .limit(limit)
      .offset(offset);

    const rooms = await query;

    // Group by room and count participants
    const roomsWithCounts = rooms.reduce((acc, room) => {
      const existingRoom = acc.find(r => r.id === room.id);
      if (existingRoom) {
        existingRoom.participantCount++;
      } else {
        acc.push({
          ...room,
          participantCount: room.participantCount ? 1 : 0,
        });
      }
      return acc;
    }, [] as any[]);

    return NextResponse.json({
      success: true,
      data: roomsWithCounts,
    });
  } catch (error) {
    console.error("Error fetching craft rooms:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch craft rooms" },
      { status: 500 }
    );
  }
}

// POST /api/craft-rooms - Create a new craft room
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const user = await verifyIdToken(idToken);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createRoomSchema.parse(body);

    // Create Daily.co room (we'll implement this next)
    const dailyRoomName = `craft-room-${createId()}`;
    const dailyRoomUrl = `https://auret.daily.co/${dailyRoomName}`;

    const roomId = createId();
    
    // Create the room
    const [room] = await db
      .insert(craftRooms)
      .values({
        id: roomId,
        hostId: user.uid,
        title: validatedData.title,
        description: validatedData.description,
        tags: validatedData.tags,
        maxParticipants: validatedData.maxParticipants,
        isPublic: validatedData.isPublic,
        requiresApproval: validatedData.requiresApproval,
        dailyRoomName,
        dailyRoomUrl,
        scheduledStartAt: validatedData.scheduledStartAt 
          ? new Date(validatedData.scheduledStartAt) 
          : null,
        actualStartedAt: new Date(),
      })
      .returning();

    // Add the host as the first participant
    await db.insert(craftRoomParticipants).values({
      roomId: room.id,
      userId: user.uid,
      role: "host",
    });

    return NextResponse.json({
      success: true,
      data: {
        ...room,
        participantCount: 1,
      },
    });
  } catch (error) {
    console.error("Error creating craft room:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create craft room" },
      { status: 500 }
    );
  }
}

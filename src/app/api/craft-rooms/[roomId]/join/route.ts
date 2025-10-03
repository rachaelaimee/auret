import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { craftRooms, craftRoomParticipants } from "@/lib/db/schema";
import { verifyIdToken } from "@/lib/firebase-admin";
import { eq, and, count } from "drizzle-orm";

interface RouteParams {
  params: {
    roomId: string;
  };
}

// POST /api/craft-rooms/[roomId]/join - Join a craft room
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
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

    const { roomId } = params;

    // Check if room exists and is active
    const room = await db
      .select()
      .from(craftRooms)
      .where(and(eq(craftRooms.id, roomId), eq(craftRooms.status, "active")))
      .limit(1);

    if (!room.length) {
      return NextResponse.json(
        { success: false, error: "Room not found or inactive" },
        { status: 404 }
      );
    }

    const roomData = room[0];

    // Check if user is already in the room
    const existingParticipant = await db
      .select()
      .from(craftRoomParticipants)
      .where(
        and(
          eq(craftRoomParticipants.roomId, roomId),
          eq(craftRoomParticipants.userId, user.uid),
          eq(craftRoomParticipants.leftAt, null) // Still active
        )
      )
      .limit(1);

    if (existingParticipant.length) {
      return NextResponse.json({
        success: true,
        data: {
          message: "Already in room",
          room: roomData,
          participant: existingParticipant[0],
        },
      });
    }

    // Check room capacity
    const [participantCountResult] = await db
      .select({ count: count() })
      .from(craftRoomParticipants)
      .where(
        and(
          eq(craftRoomParticipants.roomId, roomId),
          eq(craftRoomParticipants.leftAt, null)
        )
      );

    const currentParticipants = participantCountResult.count;

    if (currentParticipants >= roomData.maxParticipants) {
      return NextResponse.json(
        { success: false, error: "Room is full" },
        { status: 400 }
      );
    }

    // Check if room requires approval (for future implementation)
    if (roomData.requiresApproval && roomData.hostId !== user.uid) {
      // For now, we'll allow joining. Later we can implement approval workflow
    }

    // Add user to room
    const [participant] = await db
      .insert(craftRoomParticipants)
      .values({
        roomId,
        userId: user.uid,
        role: "participant",
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        message: "Successfully joined room",
        room: roomData,
        participant,
      },
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to join room" },
      { status: 500 }
    );
  }
}

// DELETE /api/craft-rooms/[roomId]/join - Leave a craft room
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
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

    const { roomId } = params;

    // Find the user's participation record
    const participant = await db
      .select()
      .from(craftRoomParticipants)
      .where(
        and(
          eq(craftRoomParticipants.roomId, roomId),
          eq(craftRoomParticipants.userId, user.uid),
          eq(craftRoomParticipants.leftAt, null)
        )
      )
      .limit(1);

    if (!participant.length) {
      return NextResponse.json(
        { success: false, error: "Not in this room" },
        { status: 400 }
      );
    }

    // Mark as left
    await db
      .update(craftRoomParticipants)
      .set({
        leftAt: new Date(),
      })
      .where(eq(craftRoomParticipants.id, participant[0].id));

    // If the host left, we might want to transfer host or end the room
    // For now, we'll just let the room continue
    const room = await db
      .select()
      .from(craftRooms)
      .where(eq(craftRooms.id, roomId))
      .limit(1);

    if (room.length && room[0].hostId === user.uid) {
      // Host left - for now just mark them as left
      // TODO: Implement host transfer or auto-end room logic
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "Successfully left room",
      },
    });
  } catch (error) {
    console.error("Error leaving room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to leave room" },
      { status: 500 }
    );
  }
}

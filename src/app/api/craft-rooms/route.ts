import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { 
  createCraftRoom, 
  getCraftRooms 
} from "@/lib/firestore-craft-rooms";
import { z } from "zod";

const createRoomSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
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

    const rooms = await getCraftRooms(limit);

    return NextResponse.json({
      success: true,
      data: rooms,
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
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createRoomSchema.parse(body);

    const room = await createCraftRoom(decodedToken.uid, {
      title: validatedData.title,
      description: validatedData.description,
      tags: validatedData.tags,
      maxParticipants: validatedData.maxParticipants,
      isPublic: validatedData.isPublic,
      requiresApproval: validatedData.requiresApproval,
      scheduledStartAt: validatedData.scheduledStartAt 
        ? new Date(validatedData.scheduledStartAt) 
        : undefined,
    });

    return NextResponse.json({
      success: true,
      data: room,
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

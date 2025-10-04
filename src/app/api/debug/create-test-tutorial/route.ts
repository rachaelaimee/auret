import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating test tutorial...');
    
    // Create a simple test tutorial
    const testTutorial = {
      title: "Test Tutorial - Getting Started with Crafting",
      description: "A simple test tutorial to initialize the tutorials collection.",
      content: "This is a test tutorial created to initialize the Firestore tutorials collection.",
      authorId: "system",
      authorName: "System",
      category: "other",
      difficulty: "beginner",
      estimatedTime: "5 minutes",
      tags: ["test", "getting-started"],
      status: "published",
      images: [],
      materials: [],
      steps: [
        {
          title: "Step 1",
          description: "This is a test step",
          images: []
        }
      ],
      views: 0,
      likes: 0,
      shopHandle: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('tutorials').add(testTutorial);
    console.log('Test tutorial created with ID:', docRef.id);

    return NextResponse.json({
      success: true,
      message: 'Test tutorial created successfully',
      tutorialId: docRef.id,
    });

  } catch (error) {
    console.error('Error creating test tutorial:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

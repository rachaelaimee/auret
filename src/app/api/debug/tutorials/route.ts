import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    console.log('Testing tutorials collection access...');
    
    // Test 1: Check if tutorials collection exists using admin SDK
    const tutorialsSnapshot = await adminDb.collection('tutorials').limit(5).get();
    console.log('Tutorials found via admin SDK:', tutorialsSnapshot.docs.length);
    
    const tutorials = tutorialsSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    // Test 2: Check total count
    const allTutorialsSnapshot = await adminDb.collection('tutorials').get();
    console.log('Total tutorials in collection:', allTutorialsSnapshot.docs.length);

    return NextResponse.json({
      success: true,
      message: 'Tutorials collection access test',
      stats: {
        sampleTutorials: tutorialsSnapshot.docs.length,
        totalTutorials: allTutorialsSnapshot.docs.length,
      },
      sampleData: tutorials,
    });

  } catch (error) {
    console.error('Tutorials test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
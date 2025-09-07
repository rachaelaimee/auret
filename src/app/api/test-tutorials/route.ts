import { NextResponse } from 'next/server'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST() {
  try {
    // Create a test tutorial to initialize the collection
    const testTutorial = {
      authorId: 'system',
      authorName: 'System',
      title: 'Welcome to Curia Corner',
      description: 'A test tutorial to initialize the tutorials collection',
      content: 'This is a test tutorial created to initialize the Firestore tutorials collection.',
      category: 'other',
      tags: ['test'],
      difficulty: 'beginner' as const,
      estimatedTime: '1 minute',
      materials: [],
      tools: [],
      images: [],
      status: 'published' as const,
      likes: 0,
      views: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, 'tutorials'), testTutorial)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test tutorial created successfully',
      id: docRef.id 
    })
  } catch (error: any) {
    console.error('Error creating test tutorial:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create test tutorial' },
      { status: 500 }
    )
  }
}

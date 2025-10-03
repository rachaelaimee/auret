import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Initializing tutorials collection...')
    
    // Create a simple tutorial document to initialize the collection
    const initTutorial = {
      id: 'welcome-tutorial',
      title: 'Welcome to Curia Corner!',
      description: 'A warm welcome to our maker community where knowledge is shared and connections are made.',
      content: `# Welcome to Curia Corner! 🎉

Thank you for joining our vibrant community of makers, creators, and artisans!

## What is Curia Corner?

Curia Corner is a space where:
- **Makers share their expertise** through detailed tutorials
- **Community members connect** and learn from each other  
- **Sellers provide guidance** to help customers create their own items
- **Everyone grows together** in their crafting journey

## Getting Started

Browse through our tutorials, ask questions, and don't hesitate to share your own knowledge. Every maker has something valuable to contribute!

Happy making! ✨`,
      category: 'other',
      difficulty: 'beginner' as const,
      estimatedTime: '5 minutes',
      materials: ['Enthusiasm', 'Creativity'],
      tools: [],
      tags: ['welcome', 'community', 'getting-started'],
      images: [],
      authorId: 'system',
      authorName: 'Curia Corner Team',
      shopHandle: null,
      shopName: null,
      status: 'published' as const,
      likes: 0,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add the document to Firestore
    await adminDb.collection('tutorials').doc('welcome-tutorial').set(initTutorial)
    
    console.log('✅ Tutorials collection initialized successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tutorials collection initialized',
      tutorialId: 'welcome-tutorial'
    })
  } catch (error: any) {
    console.error('❌ Error initializing tutorials collection:', error)
    return NextResponse.json(
      { error: 'Failed to initialize tutorials collection', details: error.message },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking tutorials collection...')
    
    // Get all documents in tutorials collection
    const tutorialsRef = adminDb.collection('tutorials')
    const snapshot = await tutorialsRef.get()
    
    if (snapshot.empty) {
      console.log('📭 Collection is empty')
      return NextResponse.json({ 
        message: 'Collection is empty',
        count: 0,
        documents: []
      })
    }
    
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }))
    
    console.log(`📋 Found ${documents.length} documents:`)
    documents.forEach(doc => {
      console.log(`- ${doc.id}: status="${doc.data.status}", title="${doc.data.title}"`)
    })
    
    return NextResponse.json({
      message: `Found ${documents.length} documents`,
      count: documents.length,
      documents
    })
  } catch (error: any) {
    console.error('❌ Error checking tutorials:', error)
    return NextResponse.json(
      { error: 'Failed to check tutorials', details: error.message },
      { status: 500 }
    )
  }
}


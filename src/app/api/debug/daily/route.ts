import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const DAILY_API_KEY = process.env.DAILY_API_KEY;
    const NEXT_PUBLIC_DAILY_DOMAIN = process.env.NEXT_PUBLIC_DAILY_DOMAIN;
    
    console.log('Debug Daily.co environment:');
    console.log('DAILY_API_KEY exists:', !!DAILY_API_KEY);
    console.log('DAILY_API_KEY length:', DAILY_API_KEY?.length);
    console.log('NEXT_PUBLIC_DAILY_DOMAIN:', NEXT_PUBLIC_DAILY_DOMAIN);
    
    if (!DAILY_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'DAILY_API_KEY not set',
        env: {
          DAILY_API_KEY: !!DAILY_API_KEY,
          NEXT_PUBLIC_DAILY_DOMAIN,
        }
      });
    }

    // Test API connection
    const testRoomName = `debug-test-${Date.now()}`;
    
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: testRoomName,
        privacy: 'public',
        properties: {
          max_participants: 10,
          enable_chat: true,
          exp: Math.floor(Date.now() / 1000) + (60 * 5), // Expire in 5 minutes
        },
      }),
    });

    const responseText = await response.text();
    console.log('Daily.co test response:', response.status, responseText);

    if (response.ok) {
      const room = JSON.parse(responseText);
      
      // Clean up the test room
      await fetch(`https://api.daily.co/v1/rooms/${testRoomName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Daily.co API is working correctly',
        testRoom: room,
        env: {
          DAILY_API_KEY: !!DAILY_API_KEY,
          DAILY_API_KEY_LENGTH: DAILY_API_KEY?.length,
          NEXT_PUBLIC_DAILY_DOMAIN,
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Daily.co API test failed',
        status: response.status,
        response: responseText,
        env: {
          DAILY_API_KEY: !!DAILY_API_KEY,
          DAILY_API_KEY_LENGTH: DAILY_API_KEY?.length,
          NEXT_PUBLIC_DAILY_DOMAIN,
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Debug Daily.co error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      env: {
        DAILY_API_KEY: !!process.env.DAILY_API_KEY,
        NEXT_PUBLIC_DAILY_DOMAIN: process.env.NEXT_PUBLIC_DAILY_DOMAIN,
      }
    }, { status: 500 });
  }
}

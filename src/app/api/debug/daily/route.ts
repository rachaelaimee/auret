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

    // Test 1: Check account info first
    console.log('Testing account access...');
    const accountResponse = await fetch('https://api.daily.co/v1/', {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });
    
    const accountText = await accountResponse.text();
    console.log('Account response:', accountResponse.status, accountText);

    // Test 2: Try creating a room with minimal properties
    const testRoomName = `debug-test-${Date.now()}`;
    
    console.log('Testing room creation with minimal properties...');
    const minimalResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: testRoomName,
      }),
    });

    const minimalText = await minimalResponse.text();
    console.log('Minimal room creation response:', minimalResponse.status, minimalText);

    if (minimalResponse.ok) {
      const room = JSON.parse(minimalText);
      
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
        accountInfo: accountResponse.ok ? JSON.parse(accountText) : null,
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
        status: minimalResponse.status,
        response: minimalText,
        accountResponse: {
          status: accountResponse.status,
          body: accountText
        },
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

// POST endpoint to test room creation with the exact same logic as craft rooms
export async function POST(request: NextRequest) {
  try {
    const DAILY_API_KEY = process.env.DAILY_API_KEY;
    
    if (!DAILY_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'DAILY_API_KEY not set'
      }, { status: 500 });
    }

    const testRoomName = `debug-craft-${Date.now()}`;
    
    // Use the exact same request as our craft room creation
    const requestBody = {
      name: testRoomName,
      privacy: 'public',
      properties: {
        max_participants: 50,
        enable_chat: true,
        enable_screenshare: true,
        enable_recording: false,
        start_video_off: false,
        start_audio_off: false,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // Expire in 24 hours
      },
    };

    console.log('Testing craft room creation with body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('Craft room creation response:', response.status, responseText);

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
        message: 'Craft room creation test successful',
        testRoom: room,
        requestBody
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Craft room creation test failed',
        status: response.status,
        response: responseText,
        requestBody
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Debug craft room creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

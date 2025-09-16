import { NextRequest, NextResponse } from 'next/server';
import { GET as enhancedGET, POST as enhancedPOST, PUT as enhancedPUT, DELETE as enhancedDELETE } from '../questions/enhanced-v2/route';

// Legacy API route - proxy to enhanced-v2
export async function GET(request: NextRequest) {
  try {
    // Proxy to enhanced-v2 API
    return await enhancedGET(request);
  } catch (error) {
    console.error('Legacy questions API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await enhancedPOST(request);
  } catch (error) {
    console.error('Legacy questions API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    return await enhancedPUT(request);
  } catch (error) {
    console.error('Legacy questions API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return await enhancedDELETE(request);
  } catch (error) {
    console.error('Legacy questions API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
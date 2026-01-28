import { NextRequest, NextResponse } from 'next/server';
import { checkSearchVisibility } from '@/lib/openai';
import { VisibilityRequest, VisibilityResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: VisibilityRequest = await request.json();

    if (!body.businessName || !body.niche || !body.location) {
      return NextResponse.json(
        { error: 'Business name, niche, and location are required' },
        { status: 400 }
      );
    }

    const ranked = await checkSearchVisibility(
      body.businessName,
      body.niche,
      body.location
    );

    const response: VisibilityResponse = {
      ranked,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Visibility API error:', error);

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

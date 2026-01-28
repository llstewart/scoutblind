import { NextRequest, NextResponse } from 'next/server';
import { searchGoogleMaps } from '@/lib/outscraper';
import { SearchRequest, SearchResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();

    if (!body.niche || !body.location) {
      return NextResponse.json(
        { error: 'Niche and location are required' },
        { status: 400 }
      );
    }

    const businesses = await searchGoogleMaps(body.niche, body.location, 50);

    const response: SearchResponse = {
      businesses,
      totalResults: businesses.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search API error:', error);

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

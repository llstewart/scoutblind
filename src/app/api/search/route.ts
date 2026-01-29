import { NextRequest, NextResponse } from 'next/server';
import { searchGoogleMaps } from '@/lib/outscraper';
import { SearchRequest, SearchResponse, Business } from '@/lib/types';
import { cache, CACHE_TTL } from '@/lib/cache';
import MemoryCache from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();

    if (!body.niche || !body.location) {
      return NextResponse.json(
        { error: 'Niche and location are required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = MemoryCache.searchKey(body.niche, body.location);
    const cachedResults = cache.get<Business[]>(cacheKey);

    if (cachedResults) {
      console.log(`[Search API] Cache HIT for "${body.niche}" in "${body.location}"`);
      const response: SearchResponse = {
        businesses: cachedResults,
        totalResults: cachedResults.length,
        cached: true,
      };
      return NextResponse.json(response);
    }

    console.log(`[Search API] Cache MISS for "${body.niche}" in "${body.location}"`);
    const businesses = await searchGoogleMaps(body.niche, body.location, 50);

    // Cache the results
    cache.set(cacheKey, businesses, CACHE_TTL.SEARCH_RESULTS);

    const response: SearchResponse = {
      businesses,
      totalResults: businesses.length,
      cached: false,
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

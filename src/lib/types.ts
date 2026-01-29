export interface Business {
  name: string;
  placeId: string | null;
  address: string;
  phone: string | null;
  website: string | null;
  rating: number;
  reviewCount: number;
  category: string;
  claimed: boolean;
  sponsored: boolean;
}

export interface EnrichedBusiness extends Business {
  ownerName: string | null;
  ownerPhone: string | null;
  lastReviewDate: Date | null;
  lastOwnerActivity: Date | null;
  daysDormant: number | null;
  searchVisibility: boolean;
  responseRate: number;
  locationType: 'residential' | 'commercial';
  websiteTech: string;
  seoOptimized: boolean;
  isEnriching?: false; // Fully enriched
}

// Business that is currently being enriched - shows spinners
export interface PendingBusiness extends Business {
  isEnriching: true;
}

// Union type for table display
export type TableBusiness = EnrichedBusiness | PendingBusiness;

// Type guard to check if business is still pending enrichment
export function isPendingBusiness(business: TableBusiness): business is PendingBusiness {
  return 'isEnriching' in business && business.isEnriching === true;
}

export interface SearchRequest {
  niche: string;
  location: string;
}

export interface SearchResponse {
  businesses: Business[];
  totalResults: number;
  cached?: boolean;
}

export interface AnalyzeRequest {
  businesses: Business[];
  niche: string;
  location: string;
}

export interface AnalyzeResponse {
  enrichedBusinesses: EnrichedBusiness[];
}

export interface VisibilityRequest {
  businessName: string;
  niche: string;
  location: string;
}

export interface VisibilityResponse {
  ranked: boolean;
}

export interface OutscraperPlace {
  name: string;
  full_address: string;
  phone: string | null;
  site: string | null;
  rating: number | null;
  reviews: number | null;
  type: string;
  verified: boolean;
  is_claimed: boolean;
  is_sponsored: boolean;
  reviews_data?: OutscraperReview[];
  posts_data?: OutscraperPost[];
}

export interface OutscraperReview {
  review_id: string;
  review_text: string;
  review_rating: number;
  review_datetime_utc: string;
  owner_answer: string | null;
  owner_answer_timestamp_datetime_utc: string | null;
}

export interface OutscraperPost {
  post_id: string;
  post_text: string;
  post_datetime_utc: string;
}

export type StatusType = 'success' | 'warning' | 'error' | 'neutral';

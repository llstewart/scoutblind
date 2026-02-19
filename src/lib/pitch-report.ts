import { EnrichedBusiness } from './types';
import { calculateSeoNeedScore, getSeoNeedSummary, type CategorizedSignals } from './signals';

export interface PitchReportData {
  businessName: string;
  address: string;
  phone: string | null;
  website: string | null;
  category: string;
  rating: number;
  reviewCount: number;
  seoNeedScore: number;
  seoNeedLevel: 'high' | 'medium' | 'low';
  signalGroups: CategorizedSignals;
  keyFindings: string[];
  marketPosition: {
    searchRank: number | null;
    responseRate: number;
    daysDormant: number | null;
    claimed: boolean;
    hasWebsite: boolean;
    seoOptimized: boolean;
  };
  generatedAt: Date;
  niche?: string;
  location?: string;
}

export function generatePitchReportData(
  business: EnrichedBusiness,
  niche?: string,
  location?: string
): PitchReportData {
  const score = calculateSeoNeedScore(business);
  const level = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';
  const signalGroups = getSeoNeedSummary(business);
  const keyFindings = generateKeyFindings(business);

  return {
    businessName: business.name,
    address: business.address,
    phone: business.phone,
    website: business.website,
    category: business.category,
    rating: business.rating,
    reviewCount: business.reviewCount,
    seoNeedScore: score,
    seoNeedLevel: level,
    signalGroups,
    keyFindings,
    marketPosition: {
      searchRank: business.searchVisibility,
      responseRate: business.responseRate,
      daysDormant: business.daysDormant,
      claimed: business.claimed,
      hasWebsite: !!business.website,
      seoOptimized: business.seoOptimized,
    },
    generatedAt: new Date(),
    niche,
    location,
  };
}

export function generateKeyFindings(business: EnrichedBusiness): string[] {
  const findings: string[] = [];

  if (business.searchVisibility === null) {
    findings.push('This business is not appearing in Google search results for its category.');
  } else if (business.searchVisibility > 10) {
    findings.push(`This business ranks #${business.searchVisibility} in search — effectively invisible on page 2+.`);
  } else if (business.searchVisibility > 5) {
    findings.push(`This business ranks #${business.searchVisibility} — below the fold in search results.`);
  }

  if (!business.claimed) {
    findings.push('The Google Business Profile is unclaimed, leaving it vulnerable to unauthorized edits and missing key features.');
  }

  if (business.daysDormant !== null && business.daysDormant > 180) {
    findings.push(`The owner hasn't responded to reviews in over ${Math.round(business.daysDormant / 30)} months, signaling inactivity to Google.`);
  } else if (business.daysDormant !== null && business.daysDormant > 90) {
    findings.push(`The owner hasn't responded to reviews in ${business.daysDormant} days.`);
  }

  if (business.responseRate < 20 && business.reviewCount > 0) {
    findings.push(`Only ${business.responseRate}% of customer reviews receive a reply — well below the recommended 80%+.`);
  } else if (business.responseRate < 50 && business.reviewCount > 0) {
    findings.push(`The review response rate of ${business.responseRate}% leaves room for significant improvement.`);
  }

  if (!business.website) {
    findings.push('No website detected. Over 80% of consumers research online before visiting a business.');
  } else if (!business.seoOptimized) {
    findings.push('The website lacks basic SEO tools, limiting its ability to attract organic search traffic.');
  }

  if (business.reviewCount < 20) {
    findings.push(`With only ${business.reviewCount} reviews, this business lacks the social proof needed to compete effectively.`);
  }

  if (business.rating > 0 && business.rating < 4) {
    findings.push(`A ${business.rating}-star rating is below the 4.0+ threshold that most consumers use to filter businesses.`);
  }

  // Return top 5 findings
  return findings.slice(0, 5);
}

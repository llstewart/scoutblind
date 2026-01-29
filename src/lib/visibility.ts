import { searchGoogleMaps } from './outscraper';

// Number of top results to check for visibility
const VISIBILITY_TOP_N = 10;

/**
 * Check if a business appears in actual Google Maps search results
 * This uses real search data instead of AI-generated lists
 */
export async function checkSearchVisibility(
  businessName: string,
  niche: string,
  location: string
): Promise<boolean> {
  try {
    console.log(`[Visibility] Checking if "${businessName}" ranks for "${niche}" in "${location}"`);

    // Search Google Maps for the niche in location
    const results = await searchGoogleMaps(niche, location, VISIBILITY_TOP_N);

    // Check if the business appears in top results
    const normalizedBusinessName = businessName.toLowerCase().trim();

    for (let i = 0; i < results.length; i++) {
      const resultName = results[i].name.toLowerCase().trim();

      // Check for exact match or significant overlap
      if (resultName === normalizedBusinessName) {
        console.log(`[Visibility] ✓ "${businessName}" found at position ${i + 1} (exact match)`);
        return true;
      }

      // Check if one contains the other (handles "Joe's Plumbing" vs "Joe's Plumbing LLC")
      if (resultName.includes(normalizedBusinessName) || normalizedBusinessName.includes(resultName)) {
        console.log(`[Visibility] ✓ "${businessName}" found at position ${i + 1} (partial match: "${results[i].name}")`);
        return true;
      }

      // Check significant word overlap (3+ char words)
      const businessWords = normalizedBusinessName.split(/\s+/).filter(w => w.length > 3);
      const resultWords = resultName.split(/\s+/).filter(w => w.length > 3);
      const matchingWords = businessWords.filter(w => resultWords.includes(w));

      if (businessWords.length > 0 && matchingWords.length >= Math.ceil(businessWords.length * 0.6)) {
        console.log(`[Visibility] ✓ "${businessName}" found at position ${i + 1} (word match: "${results[i].name}")`);
        return true;
      }
    }

    console.log(`[Visibility] ✗ "${businessName}" not found in top ${results.length} results`);
    return false;
  } catch (error) {
    console.error('[Visibility] Check failed:', error);
    return false;
  }
}

/**
 * Batch check visibility for multiple businesses
 * Makes ONE search request and checks all businesses against it
 */
export async function batchCheckVisibility(
  businesses: { name: string }[],
  niche: string,
  location: string
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  try {
    console.log(`[Visibility] Batch checking ${businesses.length} businesses for "${niche}" in "${location}"`);

    // Make ONE search request
    const searchResults = await searchGoogleMaps(niche, location, VISIBILITY_TOP_N);

    // Normalize search result names for comparison
    const topBusinessNames = searchResults.map(r => r.name.toLowerCase().trim());

    console.log(`[Visibility] Top ${searchResults.length} results:`, topBusinessNames.slice(0, 5));

    // Check each business against the search results
    for (const business of businesses) {
      const normalizedName = business.name.toLowerCase().trim();
      let found = false;

      for (const resultName of topBusinessNames) {
        // Exact match
        if (resultName === normalizedName) {
          found = true;
          break;
        }

        // Partial match
        if (resultName.includes(normalizedName) || normalizedName.includes(resultName)) {
          found = true;
          break;
        }

        // Word overlap check
        const businessWords = normalizedName.split(/\s+/).filter(w => w.length > 3);
        const resultWords = resultName.split(/\s+/).filter(w => w.length > 3);
        const matchingWords = businessWords.filter(w => resultWords.includes(w));

        if (businessWords.length > 0 && matchingWords.length >= Math.ceil(businessWords.length * 0.6)) {
          found = true;
          break;
        }
      }

      results.set(business.name, found);
    }

    const rankedCount = Array.from(results.values()).filter(v => v).length;
    console.log(`[Visibility] Batch complete: ${rankedCount}/${businesses.length} businesses found in top results`);

  } catch (error) {
    console.error('[Visibility] Batch check failed:', error);
    // Default all to false on error
    for (const business of businesses) {
      results.set(business.name, false);
    }
  }

  return results;
}

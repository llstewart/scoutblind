const RESIDENTIAL_INDICATORS = [
  /\bapt\.?\s*#?\d*/i,
  /\bapartment\s*#?\d*/i,
  /\bunit\s*#?\d*/i,
  /\bste\.?\s*#?\d*/i,
  /\bsuite\s*#?\d*/i,
  /\b#\d+[a-z]?\b/i,
  /\bfloor\s*\d+/i,
  /\bfl\.?\s*\d+/i,
  /\broom\s*\d+/i,
  /\brm\.?\s*\d+/i,
  /\bbldg\.?\s*[a-z0-9]+/i,
  /\bbuilding\s*[a-z0-9]+/i,
];

const COMMERCIAL_INDICATORS = [
  /\bplaza\b/i,
  /\bmall\b/i,
  /\bshopping center\b/i,
  /\bbusiness park\b/i,
  /\bindustrial\b/i,
  /\bcommercial\b/i,
  /\boffice\s*park\b/i,
  /\bcorporate\b/i,
  /\bwarehouse\b/i,
  /\bdistribution\b/i,
];

export function classifyLocationType(address: string): 'residential' | 'commercial' {
  if (!address) {
    return 'commercial'; // Default to commercial if no address
  }

  const normalizedAddress = address.toLowerCase();

  // Check for strong commercial indicators first
  for (const pattern of COMMERCIAL_INDICATORS) {
    if (pattern.test(normalizedAddress)) {
      return 'commercial';
    }
  }

  // Check for residential indicators
  for (const pattern of RESIDENTIAL_INDICATORS) {
    if (pattern.test(normalizedAddress)) {
      return 'residential';
    }
  }

  // Default to commercial for businesses
  return 'commercial';
}

export function formatAddress(address: string): string {
  if (!address) {
    return 'Address not available';
  }

  // Clean up extra whitespace
  return address.replace(/\s+/g, ' ').trim();
}

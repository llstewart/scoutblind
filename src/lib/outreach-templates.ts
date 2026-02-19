import { EnrichedBusiness } from './types';

export interface OutreachTemplate {
  id: string;
  title: string;
  trigger: string;
  subject: string;
  body: string;
}

export function generateOutreachTemplates(business: EnrichedBusiness, niche: string): OutreachTemplate[] {
  const templates: OutreachTemplate[] = [];
  const bizName = business.name;
  const nicheLabel = niche || 'your industry';

  // Unclaimed profile
  if (!business.claimed) {
    templates.push({
      id: 'unclaimed',
      title: 'Unclaimed Profile Outreach',
      trigger: 'Profile is unclaimed',
      subject: `${bizName} — Your Google Business Profile isn't claimed`,
      body: `Hi,

I was researching ${nicheLabel} businesses in your area and came across ${bizName}. I noticed your Google Business Profile isn't claimed yet — which means anyone could potentially edit your listing, and you're missing out on features like responding to reviews, adding photos, and showing up higher in local search.

Claiming and optimizing your profile is one of the fastest ways to get more calls and walk-ins. I help local businesses like yours do exactly this.

Would you be open to a quick 10-minute call to see if I can help?

Best regards`,
    });
  }

  // Low response rate
  if (business.responseRate < 30 && business.reviewCount > 0) {
    templates.push({
      id: 'low-response',
      title: 'Low Review Response Rate',
      trigger: `Only ${business.responseRate}% response rate`,
      subject: `${bizName} — Quick tip about your Google reviews`,
      body: `Hi,

I noticed ${bizName} has ${business.reviewCount} Google reviews, but the owner response rate is around ${business.responseRate}%. Businesses that respond to reviews consistently see 35% more clicks from Google search results.

Responding to reviews (especially negative ones) shows potential customers that you care about their experience. It also sends positive signals to Google's algorithm for local rankings.

I help ${nicheLabel} businesses manage their online reputation and improve their visibility. Would it be worth 10 minutes to chat about what that could look like for ${bizName}?

Best regards`,
    });
  }

  // No website
  if (!business.website) {
    templates.push({
      id: 'no-website',
      title: 'No Website Detected',
      trigger: 'No website found',
      subject: `${bizName} — You're invisible to online searchers`,
      body: `Hi,

I was looking into ${nicheLabel} businesses in your area and noticed ${bizName} doesn't appear to have a website. With ${business.reviewCount} reviews and a ${business.rating} star rating, you clearly have satisfied customers — but you're missing a huge chunk of potential business.

Over 80% of consumers research businesses online before visiting. Without a website, you're losing those customers to competitors who do have one.

I build fast, affordable websites for ${nicheLabel} businesses that are designed to convert searchers into customers. Could we set up a quick call to discuss?

Best regards`,
    });
  }

  // Not ranking in search
  if (business.searchVisibility === null) {
    templates.push({
      id: 'not-ranking',
      title: 'Not Appearing in Search',
      trigger: 'Not found in top 20 results',
      subject: `${bizName} — You're not showing up when people search for "${niche}"`,
      body: `Hi,

I recently searched for "${niche}" in your area, and ${bizName} didn't appear in the top 20 Google results. That means when potential customers are actively looking for exactly what you offer, they're finding your competitors instead.

The good news is that local search rankings can be improved significantly with the right optimization — things like your Google Business Profile, website content, and review strategy all play a role.

I specialize in helping ${nicheLabel} businesses climb the local search rankings. Would you be open to a quick chat about what's holding ${bizName} back?

Best regards`,
    });
  }

  // Few reviews
  if (business.reviewCount < 20) {
    templates.push({
      id: 'low-reviews',
      title: 'Low Review Count',
      trigger: `Only ${business.reviewCount} reviews`,
      subject: `${bizName} — A simple way to get more customers`,
      body: `Hi,

I noticed ${bizName} has ${business.reviewCount} Google reviews. In the ${nicheLabel} space, businesses with 50+ reviews typically get 2-3x more clicks and calls from Google.

The great news is there are simple, ethical systems to consistently generate more reviews from your happy customers. Most businesses are leaving reviews on the table simply because they don't ask at the right time.

I help businesses like ${bizName} build review generation systems that run on autopilot. Would a quick 10-minute call be worthwhile?

Best regards`,
    });
  }

  // Dormant profile
  if (business.daysDormant !== null && business.daysDormant > 180) {
    templates.push({
      id: 'dormant',
      title: 'Dormant Profile Reactivation',
      trigger: `${business.daysDormant} days since last activity`,
      subject: `${bizName} — Your Google presence needs attention`,
      body: `Hi,

I was researching ${nicheLabel} businesses in your area and noticed that ${bizName}'s Google Business Profile hasn't had any owner activity in about ${Math.round(business.daysDormant / 30)} months. Google's algorithm favors active profiles, so this inactivity could be hurting your visibility in local search.

Simple actions like posting updates, responding to reviews, and adding new photos can signal to Google that your business is active and relevant.

I help ${nicheLabel} businesses revitalize their online presence and get back in front of local searchers. Would a 10-minute chat be helpful?

Best regards`,
    });
  }

  // Return top 3 most relevant
  return templates.slice(0, 3);
}

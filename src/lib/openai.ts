import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    openaiClient = new OpenAI({ apiKey });
  }

  return openaiClient;
}

export async function checkSearchVisibility(
  businessName: string,
  niche: string,
  location: string
): Promise<boolean> {
  const client = getOpenAIClient();

  const prompt = `I am looking for a ${niche} in ${location}. Please list the top 5 best options based on reputation. Just list the business names, one per line.`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Check if the business name appears in the response
    // Use case-insensitive matching and handle partial matches
    const normalizedResponse = responseText.toLowerCase();
    const normalizedBusinessName = businessName.toLowerCase();

    // Check for exact match or significant substring match
    const isRanked = normalizedResponse.includes(normalizedBusinessName) ||
      normalizedBusinessName.split(' ').filter(word => word.length > 3).some(
        word => normalizedResponse.includes(word.toLowerCase())
      );

    return isRanked;
  } catch (error) {
    console.error('OpenAI visibility check failed:', error);
    return false;
  }
}

export async function batchCheckVisibility(
  businesses: { name: string }[],
  niche: string,
  location: string
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  const client = getOpenAIClient();

  // Make ONE API call to get top 5 businesses, then check all names against it
  const prompt = `I am looking for a ${niche} in ${location}. Please list the top 5 best options based on reputation. Just list the business names, one per line.`;

  try {
    console.log(`[OpenAI] Fetching top 5 ${niche} in ${location}...`);

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const normalizedResponse = responseText.toLowerCase();

    console.log(`[OpenAI] Top 5 response received, checking ${businesses.length} businesses against it`);

    // Check each business name against the single response
    for (const business of businesses) {
      const normalizedName = business.name.toLowerCase();

      // Check for exact match or significant word match
      const isRanked = normalizedResponse.includes(normalizedName) ||
        normalizedName.split(' ').filter(word => word.length > 3).some(
          word => normalizedResponse.includes(word.toLowerCase())
        );

      results.set(business.name, isRanked);
    }
  } catch (error) {
    console.error('[OpenAI] Visibility check failed:', error);
    // Default all to false on error
    for (const business of businesses) {
      results.set(business.name, false);
    }
  }

  return results;
}

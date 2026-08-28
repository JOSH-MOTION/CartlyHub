import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Groq's OpenAI-compatible endpoint. Server-only key — never sent to the
// client, so both the web seller portal and the mobile app can safely call
// this route without either one holding the credential.
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_AUTOFILL_MODEL || 'qwen/qwen3.8-27b';

// qwen3.8-27b (the model with strict JSON-schema support) accepts up to 3
// images per request, but each image costs 2048 tokens and Groq's free tier
// caps at 8K tokens/minute — 3 images plus the prompt text leaves almost no
// room and would rate-limit after one call. 2 images fits comfortably.
const MAX_IMAGES = 2;

export async function POST(request) {
  if (!GROQ_API_KEY) {
    return NextResponse.json(
      { error: 'AI auto-fill is not configured on the server.' },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { imageUrls, categories, genders, conditions } = body || {};

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return NextResponse.json({ error: 'At least one image URL is required.' }, { status: 400 });
  }
  if (!Array.isArray(categories) || categories.length === 0) {
    return NextResponse.json({ error: 'A category list is required.' }, { status: 400 });
  }

  const images = imageUrls.slice(0, MAX_IMAGES);
  const genderList = Array.isArray(genders) ? genders.filter(Boolean) : [];
  const conditionList = Array.isArray(conditions) ? conditions.filter(Boolean) : [];

  // Web and mobile each keep their own category taxonomy (they've drifted
  // apart over time), so the caller sends its own flattened list rather than
  // this route hardcoding one. Every id the model is allowed to return comes
  // from this list, and the (categoryId, subcategoryId) pair is re-checked
  // against it below — enum membership alone doesn't stop the model pairing
  // a valid top id with a valid but unrelated subcategory id.
  const categoryIds = [...new Set(categories.map((c) => c.categoryId).filter(Boolean))];
  const subcategoryIds = [...new Set(categories.map((c) => c.subcategoryId).filter(Boolean))];
  const validPairs = new Set(categories.map((c) => `${c.categoryId}::${c.subcategoryId}`));

  const categoryLines = categories
    .map((c) => `${c.categoryId} > ${c.subcategoryId} — "${c.categoryName} > ${c.subcategoryName}"`)
    .join('\n');

  const systemPrompt = [
    'You are a listing assistant for CartlyHub, a Ghanaian online marketplace selling everything from fashion to electronics to vehicles.',
    'Given photos of an item a seller is about to list, extract accurate, honest listing details.',
    '',
    'Rules:',
    '- categoryId and subcategoryId MUST be copied exactly (case-sensitive) from the list below as a matching pair — never invent an id.',
    '- name: a concise, specific product title, max ~60 characters. No marketing fluff, no emojis, no ALL CAPS.',
    '- description: 2-3 honest sentences describing only what is visible in the photos. Do not invent specs, materials, or condition details you cannot see.',
    '- brand: only if a logo, tag, or label is clearly visible or unmistakable from the design. Use an empty string otherwise — never guess.',
    conditionList.length
      ? `- condition: exactly one of: ${conditionList.join(', ')}. Best guess from visible wear; if unclear, use the newest-looking plausible option.`
      : null,
    genderList.length
      ? `- gender: exactly one of: ${genderList.join(', ')}, or an empty string if not applicable to this item (e.g. electronics, home goods).`
      : null,
    '',
    'Valid categories (categoryId > subcategoryId — "category name > subcategory name"):',
    categoryLines,
  ]
    .filter(Boolean)
    .join('\n');

  const schemaProperties = {
    name: { type: 'string' },
    description: { type: 'string' },
    categoryId: { type: 'string', enum: categoryIds },
    subcategoryId: { type: 'string', enum: subcategoryIds },
    brand: { type: 'string' },
  };
  const required = ['name', 'description', 'categoryId', 'subcategoryId', 'brand'];

  if (genderList.length) {
    schemaProperties.gender = { type: 'string', enum: [...genderList, ''] };
    required.push('gender');
  }
  if (conditionList.length) {
    schemaProperties.condition = { type: 'string', enum: conditionList };
    required.push('condition');
  }

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract the listing details for this item from its photos.' },
              ...images.map((url) => ({ type: 'image_url', image_url: { url } })),
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'product_autofill',
            strict: true,
            schema: {
              type: 'object',
              properties: schemaProperties,
              required,
              additionalProperties: false,
            },
          },
        },
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq auto-fill request failed:', groqResponse.status, errText);
      return NextResponse.json(
        { error: 'AI auto-fill failed. Please fill the details in manually.' },
        { status: 502 },
      );
    }

    const data = await groqResponse.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: 'AI auto-fill returned no result.' }, { status: 502 });
    }

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'AI auto-fill returned an unreadable result.' }, { status: 502 });
    }

    if (!validPairs.has(`${result.categoryId}::${result.subcategoryId}`)) {
      result.categoryId = '';
      result.subcategoryId = '';
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Product auto-fill error:', error);
    return NextResponse.json(
      { error: 'AI auto-fill failed. Please fill the details in manually.' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

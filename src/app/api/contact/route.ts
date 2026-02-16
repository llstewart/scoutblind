import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Simple in-memory rate limit for contact form (3 per IP per hour)
const submissions = new Map<string, number[]>();

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) return vercelForwardedFor.split(',')[0].trim();
  return '127.0.0.1';
}

function checkContactRateLimit(ip: string): boolean {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const existing = submissions.get(ip) || [];
  const recent = existing.filter((t) => now - t < oneHour);
  submissions.set(ip, recent);
  return recent.length < 3;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (!checkContactRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 }
    );
  }

  let body: { name?: string; email?: string; subject?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { name, email, subject, message } = body;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return NextResponse.json(
      { error: 'All fields are required.' },
      { status: 400 }
    );
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Please provide a valid email address.' },
      { status: 400 }
    );
  }

  // Length validation
  if (name.length > 200 || email.length > 200 || subject.length > 200 || message.length > 5000) {
    return NextResponse.json(
      { error: 'One or more fields exceed maximum length.' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('contact_submissions')
      .insert({ name, email, subject, message });

    if (error) {
      console.error('[Contact] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to submit. Please try again later.' },
        { status: 500 }
      );
    }

    // Record the submission for rate limiting
    const existing = submissions.get(ip) || [];
    existing.push(Date.now());
    submissions.set(ip, existing);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Contact] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

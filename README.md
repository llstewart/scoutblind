# TrueSignal

**Find SEO prospects in half the time.**

TrueSignal is a B2B SaaS platform designed for SEO agencies to identify high-propensity sales leads. It scans Google Business Profiles to analyze local businesses and surfaces those with weak SEO signals, poor review engagement, and local search visibility gaps.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Subscription Tiers](#subscription-tiers)
- [Contributing](#contributing)
- [License](#license)
- [Legal Notice](#legal-notice)
- [Contact](#contact)

---

## Overview

TrueSignal automates the process of finding businesses that need SEO services. By analyzing Google Business Profiles, the platform identifies hidden signals that indicate SEO opportunity—helping SEO agencies fill their sales pipeline with qualified leads.

### Core Value Proposition

- Automated discovery of businesses needing SEO services
- Deep analysis of Google Business Profile signals
- Intelligent scoring algorithm that prioritizes high-opportunity leads
- Export capabilities for seamless integration into sales workflows

---

## Features

### Search & Discovery
- Search for businesses by industry niche and location (US states, Canadian provinces, UK, Australia)
- Returns approximately 25 businesses per search from Google Maps
- Smart caching system—identical searches cost 0 credits

### Lead Intelligence Analysis
Enriches search results with deep signals including:
- **Search Visibility** — Checks if business ranks in top 20 for their niche in location
- **GMB Activity** — Days since last owner activity, review engagement rate
- **Website Tech Stack** — CMS detection (WordPress, Wix, Shopify, etc.)
- **SEO Optimization** — Detection of SEO plugins (Yoast, Rank Math, etc.)
- **Review Metrics** — Last review date, response rate to reviews
- **Business Claims** — Whether GMB profile is claimed
- **Location Type** — Residential vs. commercial address classification

### SEO Need Scoring Algorithm
Businesses are rated 0-100 based on:
- Not ranked in local search (30 pts)
- Days dormant/inactive (0-25 pts)
- Low review response rate (0-15 pts)
- No SEO optimization detected (10 pts)
- Unclaimed profile (10 pts)
- Rating below 4.5 stars (0-5 pts)
- Fewer than 100 reviews (0-5 pts)

### Data Export
- CSV export of general business lists
- CSV export with full Lead Intel enrichment data

### Search History & Saved Analyses
- Automatic saved searches by niche/location
- Persistent storage for logged-in users

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14.2 |
| **Language** | TypeScript 5.3 |
| **Frontend** | React 18.2, Tailwind CSS 3.4 |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Payments** | Stripe |
| **Caching** | Upstash Redis |
| **Rate Limiting** | Upstash Rate Limit |
| **Icons** | Lucide React |
| **External APIs** | Outscraper (Google Business Profile data) |

---

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account
- Stripe account
- Upstash account
- Outscraper API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/llstewart/TrueSignal.git
cd TrueSignal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see below)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Outscraper
OUTSCRAPER_API_KEY=your_outscraper_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Usage

1. **Sign Up** — Create an account to get started with 5 free credits
2. **Search** — Enter a business niche and location to find prospects
3. **Analyze** — Use Lead Intelligence to enrich results with deep SEO signals
4. **Score** — Review businesses prioritized by SEO need score
5. **Export** — Download CSV files for your sales workflow

---

## Project Structure

```
TrueSignal/
├── app/                    # Next.js pages and API routes
│   ├── api/               # Backend API endpoints
│   ├── account/           # Account settings
│   ├── history/           # Search history
│   ├── library/           # Saved analyses
│   └── auth/              # Authentication callbacks
├── components/            # React components
│   ├── app/              # Main application UI
│   ├── auth/             # Authentication components
│   └── marketing/        # Landing page components
├── contexts/              # React context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── supabase/         # Database clients
│   ├── stripe/           # Payment integration
│   └── ...               # Other utilities
├── public/                # Static assets
└── styles/                # Global styles
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | POST | Search Google Business Profiles |
| `/api/analyze` | POST | Analyze businesses with Lead Intel |
| `/api/analyze-stream` | POST | Streaming analysis with prioritization |
| `/api/analyze-selected` | POST | Analyze selected businesses |
| `/api/analyze-single` | POST | Analyze a single business |
| `/api/visibility` | POST | Check search ranking visibility |
| `/api/stripe/checkout` | POST | Create Stripe checkout session |
| `/api/stripe/portal` | POST | Redirect to Stripe customer portal |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks |
| `/api/usage` | GET | Get usage statistics |
| `/api/session` | GET | Get user session info |

---

## Subscription Tiers

| Tier | Price | Credits/Month | Features |
|------|-------|---------------|----------|
| **Free** | $0 | 5 | Search only |
| **Starter** | $29/mo | 50 | Full Lead Intel access |
| **Pro** | $79/mo | 200 | Full Lead Intel access |
| **Enterprise** | $199/mo | 1,000 | Full Lead Intel access |

Annual plans available with ~17% discount.

---

## Contributing

This is a proprietary project. Contributions are not accepted at this time. See the [Legal Notice](#legal-notice) section for more information.

---

## License

**All Rights Reserved**

This software and its source code are the exclusive property of the copyright holder. This project is **NOT** open source.

See the [Legal Notice](#legal-notice) section for complete terms.

---

## Legal Notice

### Copyright

Copyright © 2024-2025 [llstewart](https://github.com/llstewart). All rights reserved.

### Ownership

This repository, including all source code, documentation, assets, designs, algorithms, and associated intellectual property, is the sole and exclusive property of **llstewart** (GitHub: [@llstewart](https://github.com/llstewart)).

### Restrictions

**YOU MAY NOT:**

1. **Copy, reproduce, or duplicate** any portion of this codebase for any purpose without explicit written permission from the owner.

2. **Use this code for commercial purposes**, including but not limited to:
   - Building competing products or services
   - Incorporating any portion of this code into commercial software
   - Selling, licensing, or sublicensing this code or derivatives thereof
   - Using this code to generate revenue directly or indirectly

3. **Distribute or publish** this code or any derivatives, whether publicly or privately.

4. **Modify, adapt, or create derivative works** based on this code without explicit written permission.

5. **Reverse engineer** the algorithms, processes, or methodologies implemented in this software.

6. **Remove or alter** any copyright notices, proprietary legends, or ownership attributions.

### Permitted Use

Viewing this repository for educational reference is permitted. Any other use requires explicit written authorization from the repository owner.

### Enforcement

Unauthorized use, reproduction, or distribution of this software may result in:
- Civil litigation for damages and injunctive relief
- Criminal prosecution under applicable copyright laws
- DMCA takedown notices and legal action

### No Warranty

THIS SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. THE OWNER SHALL NOT BE LIABLE FOR ANY DAMAGES ARISING FROM THE USE OR INABILITY TO USE THIS SOFTWARE.

### Jurisdiction

This agreement shall be governed by and construed in accordance with the laws of the United States. Any disputes shall be resolved in the appropriate courts of law.

---

## Contact

For inquiries regarding licensing, permissions, or commercial use:

- **GitHub:** [@llstewart](https://github.com/llstewart)
- **Repository:** [TrueSignal](https://github.com/llstewart/TrueSignal)

---

<p align="center">
  <strong>TrueSignal</strong> — Find SEO prospects in half the time.
  <br>
  Copyright © 2024-2025 llstewart. All rights reserved.
</p>

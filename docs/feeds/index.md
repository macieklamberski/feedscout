---
prev: TypeScript
next: Platform Method
---

# Discover Feeds

Feedscout discovers RSS, Atom, JSON Feed, and RDF feeds from webpages using four discovery methods.

## Basic Usage

```typescript
import { discoverFeeds } from 'feedscout'

const feeds = await discoverFeeds('https://example.com', {
  methods: ['platform', 'html', 'headers', 'guess'],
})
```

Each result contains feed metadata:

```typescript
{
  url: 'https://example.com/feed.xml',
  isValid: true,
  format: 'rss',        // 'rss' | 'atom' | 'json' | 'rdf'
  title: 'Example Blog',
  description: 'A blog about examples',
  siteUrl: 'https://example.com',
}
```

## Discovery Methods

| Method | Source |
|--------|--------|
| [Platform](/feeds/platform) | Popular platform URL patterns |
| [HTML](/feeds/html) | `<link>` and `<a>` elements |
| [Headers](/feeds/headers) | HTTP `Link` headers |
| [Guess](/feeds/guess) | Common feed paths |

## How Discovery Works

1. **URI Collection** — Each enabled method extracts potential feed URLs.
2. **Deduplication** — Duplicate URLs are removed.
3. **Validation** — Each URL is fetched and parsed to confirm it's a valid feed.
4. **Results** — Valid feeds are returned with metadata (format, title, etc.).

## Specifying Methods

### Array Syntax

Use an array to enable methods with their default options:

```typescript
const feeds = await discoverFeeds(url, {
  methods: ['platform', 'html', 'headers', 'guess'],
})
```

### Object Syntax

Use an object to customize individual method options:

```typescript
const feeds = await discoverFeeds(url, {
  methods: {
    platform: true, // Use defaults
    html: {
      anchorLabels: ['rss', 'feed'],
      anchorUris: ['/feed', '/rss'],
    },
    headers: true, // Use defaults
    guess: {
      uris: ['/feed', '/rss.xml', '/atom.xml'],
    },
  },
})
```

Set a method to `true` to use defaults, or provide an options object to customize.

## Using Existing Content

If you already have the HTML content and headers, pass them directly to avoid an extra fetch:

```typescript
// Response fetched someplace else
const response = await fetch('https://example.com')

const feeds = await discoverFeeds(
  {
    url: 'https://example.com',
    content: await response.text(),
    headers: response.headers,
  },
  { methods: ['html', 'headers'] },
)
```

## Options

### Stop on First Result

Return immediately after finding a valid result (feed, blogroll):

```typescript
const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  stopOnFirstResult: true,
})
// Returns array with at most 1 result
```

### Concurrency

Control how many URLs are validated in parallel:

```typescript
const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  concurrency: 5, // Default is 3
})
```

### Progress Tracking

Monitor discovery progress with a callback:

```typescript
const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  onProgress: ({ tested, total, found, current }) => {
    console.log(`[${tested}/${total}] Testing: ${current}`)
    console.log(`Found so far: ${found}`)
  },
})
```

### Include Invalid

Include invalid results for debugging:

```typescript
const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  includeInvalid: true,
})

for (const feed of feeds) {
  if (feed.isValid) {
    console.log(`Found: ${feed.title}`)
  } else {
    console.log(`Invalid: ${feed.url}`, feed.error)
  }
}
```

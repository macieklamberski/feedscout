---
title: Discover Favicons
---

# Discover Favicons

Feedscout can discover favicon URLs from webpages. Favicons are site icons used in browser tabs, bookmarks, and feed readers.

## Basic Usage

```typescript
import { discoverFavicons } from 'feedscout'

const favicons = await discoverFavicons('https://example.com')
```

Each result contains the favicon URL and validation status:

```typescript
{
  url: 'https://example.com/apple-touch-icon.png',
  isValid: true,
  method: 'html',
}
```

## Discovery Methods

| Method | Source | Description |
|--------|--------|-------------|
| `platform` | Platform-specific handlers | Extracts avatars/icons from known platforms (GitHub, Mastodon, Bluesky, etc.) |
| `feed` | Feed content | Extracts icon from Atom `<icon>` and JSON Feed `favicon`/`icon` fields |
| `html` | HTML `<link>` tags | Parses icon-related link elements |
| `headers` | HTTP `Link` headers | Parses `rel="icon"` links from response headers |
| `guess` | Known paths | Tries common favicon paths like `/favicon.ico`, `/apple-touch-icon.png` |

## How Discovery Works

1. **URI Collection** — Each enabled method extracts potential favicon URLs.
2. **Deduplication** — Duplicate URLs are removed.
3. **Validation** — Each URL is fetched and checked for a successful status code.
4. **Results** — Valid favicon URLs are returned.

## Specifying Methods

By default, all discovery methods are used (platform, feed, html, headers, guess). You can customize which methods to use with `methods` option.

### Array Syntax

Use an array to enable methods with their default options:

```typescript
const favicons = await discoverFavicons(url, {
  methods: ['platform', 'feed', 'html', 'headers', 'guess'],
})
```

### Object Syntax

Use an object to customize individual method options:

```typescript
const favicons = await discoverFavicons(url, {
  methods: {
    html: true, // Use defaults
    headers: true, // Use defaults
    feed: true, // Use defaults
    guess: {
      uris: ['/favicon.ico', '/icon.svg'],
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

const favicons = await discoverFavicons(
  {
    url: 'https://example.com',
    content: await response.text(),
    headers: response.headers,
  },
  { methods: ['html', 'headers'] },
)
```

## Options

### Stop on First Method

Stop URI collection after the first discovery method that produces results:

```typescript
const favicons = await discoverFavicons(url, {
  methods: ['html', 'headers', 'guess'],
  stopOnFirstMethod: true,
})
// Only URIs from the first successful method are validated
```

### Stop on First Result

Return immediately after finding a valid result:

```typescript
const favicons = await discoverFavicons(url, {
  methods: ['html', 'guess'],
  stopOnFirstResult: true,
})
// Returns array with at most 1 result
```

### Concurrency

Control how many URLs are validated in parallel:

```typescript
const favicons = await discoverFavicons(url, {
  methods: ['html', 'guess'],
  concurrency: 5, // Default is 3
})
```

### Include Invalid

Include invalid results for debugging:

```typescript
const favicons = await discoverFavicons(url, {
  methods: ['html', 'guess'],
  includeInvalid: true,
})

for (const favicon of favicons) {
  if (favicon.isValid) {
    console.log(`Found: ${favicon.url}`)
  } else {
    console.log(`Invalid: ${favicon.url}`)
  }
}
```

### Progress Tracking

Monitor discovery progress with a callback:

```typescript
const favicons = await discoverFavicons(url, {
  methods: ['html', 'guess'],
  onProgress: ({ tested, total, found, current }) => {
    console.log(`[${tested}/${total}] ${current} (${found} found)`)
  },
})
```

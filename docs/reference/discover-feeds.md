---
title: "Reference: discoverFeeds"
---

# discoverFeeds

Discovers and validates feeds from a webpage.

## Signature

```typescript
function discoverFeeds(
  input: DiscoverInput,
  options?: DiscoverOptions<FeedResult>,
): Promise<Array<DiscoverResult<FeedResult>>>
```

## Parameters

### input

The URL to discover feeds from. Can be a string or an object:

```typescript
// String - URL to fetch and scan
discoverFeeds('https://example.com', options)

// Object - provide existing content/headers
discoverFeeds({
  url: 'https://example.com',
  content: htmlContent,     // Optional HTML content
  headers: responseHeaders, // Optional HTTP headers
}, options)
```

### options

All options are optional. When not provided, sensible defaults are used.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `methods` | `DiscoverMethodsConfig` | `['platform', 'html', 'headers', 'guess']` | Which methods to use |
| `fetchFn` | `DiscoverFetchFn` | native fetch | Custom fetch function |
| `extractFn` | `DiscoverExtractFn` | feedsmith | Custom feed extraction function |
| `normalizeUrlFn` | `DiscoverNormalizeUrlFn` | | Custom URL normalization function |
| `stopOnFirstMethod` | `boolean` | `false` | Stop URI collection after first method with results |
| `stopOnFirstResult` | `boolean` | `false` | Stop after first valid feed |
| `concurrency` | `number` | `3` | Max parallel validations |
| `includeInvalid` | `boolean` | `false` | Include invalid results |
| `onProgress` | `DiscoverOnProgressFn` | | Progress callback |

## Return Value

Returns a promise that resolves to an array of results:

```typescript
// Valid result
{
  url: 'https://example.com/feed.xml',
  isValid: true,
  method: 'guess',       // 'platform' | 'feed' | 'html' | 'headers' | 'guess'
  format: 'rss',         // 'rss' | 'atom' | 'json' | 'rdf'
  title: 'Example Blog',
  description: 'A blog about examples',
  siteUrl: 'https://example.com',
}

// Invalid result (when includeInvalid: true)
{
  url: 'https://example.com/not-a-feed',
  isValid: false,
  method: 'guess',
  error: Error,
}
```

The `method` field indicates which discovery method produced the result. Results from the [Platform method](/feeds/platform) also include a [`hint`](/feeds/platform#hints) that identifies the type of feed.

## Examples

### Basic Usage

```typescript
import { discoverFeeds } from 'feedscout'

// Simple usage - all methods enabled by default
const feeds = await discoverFeeds('https://example.com')

// Or specify which methods to use
const feeds = await discoverFeeds('https://example.com', {
  methods: ['html', 'headers', 'guess'],
})
```

### With Custom Options

```typescript
const feeds = await discoverFeeds('https://example.com', {
  methods: {
    html: {
      anchorLabels: ['rss', 'feed'],
    },
    guess: {
      uris: ['/feed', '/rss.xml'],
    },
  },
  concurrency: 3,
  stopOnFirstResult: true,
})
```

### With Existing Content

```typescript
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

### With Progress Tracking

```typescript
const feeds = await discoverFeeds('https://example.com', {
  methods: ['html', 'guess'],
  onProgress: ({ tested, total, found, current }) => {
    console.log(`[${tested}/${total}] ${current} (${found} found)`)
  },
})
```

### With Custom HTTP Client

```typescript
import type { DiscoverFetchFn } from 'feedscout'

const myCustomFetch: DiscoverFetchFn = async (url, options) => {
  // Handle the request and return response here.
}

const feeds = await discoverFeeds('https://example.com', {
  methods: ['html', 'guess'],
  fetchFn: myCustomFetch,
})
```

See [Customize Data Fetching](/customization/data-fetching) for examples with Axios, Got, Ky, and more.

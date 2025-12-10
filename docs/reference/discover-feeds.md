---
prev: Overview
next: discoverBlogrolls
---

# discoverFeeds

Discovers and validates feeds from a webpage.

## Signature

```typescript
function discoverFeeds(
  input: DiscoverInput,
  options: DiscoverOptions<FeedResult>,
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

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `methods` | `DiscoverMethodsConfig` | | **Required.** Which methods to use |
| `fetchFn` | `DiscoverFetchFn` | native fetch | Custom fetch function |
| `extractFn` | `DiscoverExtractFn` | feedsmith | Custom feed extraction function |
| `normalizeUrlFn` | `DiscoverNormalizeUrlFn` | | Custom URL normalization function |
| `concurrency` | `number` | `3` | Max parallel validations |
| `stopOnFirstResult` | `boolean` | `false` | Stop after first valid feed |
| `includeInvalid` | `boolean` | `false` | Include invalid results |
| `onProgress` | `DiscoverProgressFn` | | Progress callback |

## Return Value

Returns a promise that resolves to an array of results:

```typescript
// Valid result
{
  url: 'https://example.com/feed.xml',
  isValid: true,
  format: 'rss',        // 'rss' | 'atom' | 'json' | 'rdf'
  title: 'Example Blog',
  description: 'A blog about examples',
  siteUrl: 'https://example.com',
}

// Invalid result (when includeInvalid: true)
{
  url: 'https://example.com/not-a-feed',
  isValid: false,
  error: Error,
}
```

## Examples

### Basic Usage

```typescript
import { discoverFeeds } from 'feedscout'

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
const content = await response.text()

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

### With Custom Adapter

```typescript
import axios from 'axios'
import { createAxiosAdapter } from 'feedscout/adapters'

const feeds = await discoverFeeds('https://example.com', {
  methods: ['html', 'guess'],
  fetchFn: createAxiosAdapter(axios),
})
```

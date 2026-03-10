---
title: "Reference: discoverFavicons"
---

# discoverFavicons

Discovers favicon URLs from a webpage. Uses the same discovery pipeline as `discoverFeeds` and `discoverBlogrolls`.

## Signature

```typescript
function discoverFavicons(
  input: DiscoverInput,
  options?: DiscoverOptions<FaviconResult>,
): Promise<Array<DiscoverResult<FaviconResult>>>
```

## Parameters

### input

The URL to discover favicons from. Can be a string or an object:

```typescript
// String - URL to fetch and scan
discoverFavicons('https://example.com', options)

// Object - provide existing content/headers
discoverFavicons({
  url: 'https://example.com',
  content: htmlContent,     // Optional HTML content
  headers: responseHeaders, // Optional HTTP headers
}, options)
```

### options

All options are optional. When not provided, sensible defaults are used.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `methods` | `DiscoverMethodsConfig` | `['html', 'headers', 'guess']` | Which methods to use |
| `fetchFn` | `DiscoverFetchFn` | native fetch | Custom fetch function |
| `extractFn` | `DiscoverExtractFn` | status check | Custom extraction function |
| `normalizeUrlFn` | `DiscoverNormalizeUrlFn` | | Custom URL normalization function |
| `stopOnFirstMethod` | `boolean` | `false` | Stop URI collection after first method with results |
| `stopOnFirstResult` | `boolean` | `false` | Stop after first valid favicon |
| `concurrency` | `number` | `3` | Max parallel validations |
| `includeInvalid` | `boolean` | `false` | Include invalid results |
| `onProgress` | `DiscoverOnProgressFn` | | Progress callback |

## Return Value

Returns a promise that resolves to an array of results:

```typescript
// Valid result
{
  url: 'https://example.com/favicon.ico',
  isValid: true,
  method: 'html',
}

// Invalid result (when includeInvalid: true)
{
  url: 'https://example.com/missing.png',
  isValid: false,
  method: 'guess',
}
```

Results are deduplicated by URL — the first occurrence (from the highest-priority method) is kept.

## Examples

### Basic Usage

```typescript
import { discoverFavicons } from 'feedscout'

// Simple usage - all methods enabled by default
const favicons = await discoverFavicons('https://example.com')

// Or specify which methods to use
const favicons = await discoverFavicons('https://example.com', {
  methods: ['html', 'guess'],
})
```

### With Custom Options

```typescript
const favicons = await discoverFavicons('https://example.com', {
  methods: {
    guess: {
      uris: ['/favicon.ico', '/icon.svg'],
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

const favicons = await discoverFavicons(
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
const favicons = await discoverFavicons('https://example.com', {
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

const favicons = await discoverFavicons('https://example.com', {
  fetchFn: myCustomFetch,
})
```

See [Customize Data Fetching](/customization/data-fetching) for examples with Axios, Got, Ky, and more.

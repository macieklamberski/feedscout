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
discoverFavicons('https://example.com')

// Object - provide existing content/headers
discoverFavicons({
  url: 'https://example.com',
  content: htmlContent,
  headers: responseHeaders,
})
```

### options

Uses the same `DiscoverOptions` type as other discover functions. See [discoverFeeds](/reference/discover-feeds) for the full options reference.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `methods` | `DiscoverMethodsConfig` | `['html', 'headers', 'guess']` | Methods to use |
| `fetchFn` | `DiscoverFetchFn` | native fetch | Custom fetch function |
| `normalizeUrlFn` | `DiscoverNormalizeUrlFn` | resolve relative | Custom URL normalization |
| `concurrency` | `number` | `3` | Max concurrent validation requests |
| `stopOnFirstResult` | `boolean` | `false` | Stop after first valid result |
| `stopOnFirstMethod` | `boolean` | `false` | Stop after first method finds results |
| `includeInvalid` | `boolean` | `false` | Include invalid results |

## Return Value

Returns a promise that resolves to an array of discover results:

```typescript
type DiscoverResult<FaviconResult> = {
  url: string
  isValid: boolean
  method?: 'html' | 'headers' | 'guess'
}
```

Example result:

```typescript
{
  url: 'https://example.com/favicon.ico',
  isValid: true,
  method: 'html',
}
```

Results are deduplicated by URL — the first occurrence (from the highest-priority method) is kept.

## Examples

### Basic Usage

```typescript
import { discoverFavicons } from 'feedscout'

const favicons = await discoverFavicons('https://example.com')
```

### With Specific Methods

```typescript
const favicons = await discoverFavicons('https://example.com', {
  methods: ['html', 'guess'],
})
```

### With Custom Guess Paths

```typescript
const favicons = await discoverFavicons('https://example.com', {
  methods: { guess: { uris: ['/favicon.ico', '/icon.svg'] } },
})
```

### With Existing Content

```typescript
const response = await fetch('https://example.com')
const content = await response.text()

const favicons = await discoverFavicons(
  {
    url: 'https://example.com',
    content,
    headers: response.headers,
  },
  {
    methods: ['html', 'headers'],
  },
)
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

### With Custom URL Normalization

```typescript
import type { DiscoverNormalizeUrlFn } from 'feedscout'

const normalizeUrl: DiscoverNormalizeUrlFn = (url, baseUrl) => {
  const resolved = new URL(url, baseUrl)
  resolved.protocol = 'https:'
  return resolved.href
}

const favicons = await discoverFavicons('https://example.com', {
  normalizeUrlFn: normalizeUrl,
})
```

See [Customize URL Normalization](/customization/url-normalization) for more examples.

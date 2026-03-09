---
title: "Reference: discoverFavicons"
---

# discoverFavicons

Discovers favicon URLs from a webpage.

## Signature

```typescript
function discoverFavicons(
  input: DiscoverInput,
  options?: DiscoverFaviconsOptions,
): Promise<Array<FaviconResult>>
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

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `methods` | `DiscoverFaviconsMethodsConfig` | `['html', 'manifest', 'headers', 'guess']` | Methods to use |
| `fetchFn` | `DiscoverFetchFn` | native fetch | Custom fetch function |
| `normalizeUrlFn` | `DiscoverNormalizeUrlFn` | resolve relative | Custom URL normalization |
| `api` | `ApiMethodOptions` | default providers | API method configuration |

#### methods

Array of discovery methods to use:

```typescript
type DiscoverFaviconsMethodsConfig = Array<'html' | 'manifest' | 'headers' | 'guess' | 'api'>
```

- `html` — Parse `<link rel="icon">` elements and `<meta name="msapplication-TileImage">` tags.
- `manifest` — Fetch Web App Manifest and extract `icons[]` array.
- `headers` — Parse HTTP `Link` headers for `rel="icon"`.
- `guess` — Try common favicon paths (`/favicon.ico`, `/apple-touch-icon.png`, etc.).
- `api` — Generate URLs from third-party favicon APIs (Google S2, DuckDuckGo).

#### api

Configuration for the API method:

```typescript
type ApiMethodOptions = {
  providers?: Array<FaviconApiProvider>
}
```

Custom providers:

```typescript
import { googleS2, duckDuckGo } from 'feedscout/favicons'

discoverFavicons(url, {
  methods: ['api'],
  api: {
    providers: [googleS2(128), duckDuckGo()],
  },
})
```

## Return Value

Returns a promise that resolves to an array of favicon results:

```typescript
type FaviconResult = {
  url: string           // Favicon URL
  method: FaviconMethod // Which method discovered it
  type?: string         // MIME type (e.g. "image/png")
  sizes?: string        // Icon dimensions (e.g. "32x32")
  rel?: string          // Link rel value (e.g. "apple-touch-icon")
}
```

Example result:

```typescript
{
  url: 'https://example.com/apple-touch-icon.png',
  method: 'html',
  rel: 'apple-touch-icon',
  sizes: '180x180',
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

### With Third-Party API Providers

```typescript
import { discoverFavicons } from 'feedscout'
import { googleS2, duckDuckGo } from 'feedscout/favicons'

const favicons = await discoverFavicons('https://example.com', {
  methods: ['html', 'api'],
  api: {
    providers: [googleS2(128), duckDuckGo()],
  },
})
```

### With Custom API Provider

```typescript
import type { FaviconApiProvider } from 'feedscout/favicons'

const myProvider: FaviconApiProvider = (domain) => {
  return `https://my-api.example.com/favicon/${domain}`
}

const favicons = await discoverFavicons('https://example.com', {
  methods: ['html', 'api'],
  api: {
    providers: [myProvider],
  },
})
```

---
title: "Reference: discoverBlogrolls"
---

# discoverBlogrolls

Discovers and validates OPML blogrolls from a webpage.

## Signature

```typescript
function discoverBlogrolls(
  input: DiscoverInput,
  options?: DiscoverOptions<BlogrollResult, 'html' | 'headers' | 'guess'>,
): Promise<Array<DiscoverResult<BlogrollResult>>>
```

## Parameters

### input

The URL to discover blogrolls from. Can be a string or an object:

```typescript
// String - URL to fetch and scan
discoverBlogrolls('https://example.com', options)

// Object - provide existing content/headers
discoverBlogrolls({
  url: 'https://example.com',
  content: htmlContent,
  headers: responseHeaders,
}, options)
```

### options

All options are optional. When not provided, sensible defaults are used.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `methods` | `DiscoverMethodsConfig` | `['html', 'headers', 'guess']` | Which methods to use |
| `fetchFn` | `DiscoverFetchFn` | native fetch | Custom fetch function |
| `extractFn` | `DiscoverExtractFn` | feedsmith | Custom OPML extraction function |
| `resolveUrlFn` | `DiscoverResolveUrlFn` | resolve relative | Custom URL resolution function |
| `resolveSiteUrlFn` | `DiscoverResolveSiteUrlFn` | site link from feed | Resolves the site URL to scan when the input is a feed |
| `stopOnFirstMethod` | `boolean` | `false` | Stop after the first method that finds a valid result |
| `stopOnFirstResult` | `boolean` | `false` | Stop after first valid blogroll |
| `concurrency` | `number` | `3` | Max parallel validations |
| `maxUris` | `number` | `50` | Max total candidate URIs to fetch across all methods |
| `includeInvalid` | `boolean` | `false` | Include invalid results |
| `onProgress` | `DiscoverOnProgressFn` | | Progress callback |
| `onError` | `DiscoverOnErrorFn` | | Called when fetching the input or the site URL fails, or a function you passed in throws |

## Return Value

Returns a promise that resolves to an array of results:

```typescript
// Valid result
{
  url: 'https://example.com/blogroll.opml',
  isValid: true,
  method: 'guess',
  title: 'My Reading List',
}

// Invalid result (when includeInvalid: true)
{
  url: 'https://example.com/not-opml.xml',
  isValid: false,
  method: 'guess',
  error: Error, // Only set when the request itself failed
}
```

## Examples

### Basic Usage

```typescript
import { discoverBlogrolls } from 'feedscout'

// Simple usage - all methods enabled by default
const blogrolls = await discoverBlogrolls('https://example.com')

// Or specify which methods to use
const blogrolls = await discoverBlogrolls('https://example.com', {
  methods: ['html', 'guess'],
})
```

### With Custom Options

```typescript
import { urisComprehensive } from 'feedscout/blogrolls'

const blogrolls = await discoverBlogrolls('https://example.com', {
  methods: {
    html: {
      anchorLabels: ['blogroll', 'opml'],
    },
    guess: {
      uris: urisComprehensive,
    },
  },
})
```


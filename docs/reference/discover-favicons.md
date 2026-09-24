---
title: "Reference: discoverFavicons"
---

# discoverFavicons

Discovers favicon URLs from a webpage or feed.

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
  content: htmlContent,
  headers: responseHeaders,
}, options)
```

### options

All options are optional. When not provided, sensible defaults are used.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `methods` | `DiscoverMethodsConfig` | `['platform', 'feed', 'html', 'headers', 'guess']` | Which methods to use |
| `fetchFn` | `FetchFn` | native fetch | Custom fetch function |
| `enrichFn` | [`DiscoverEnrichFn`](/reference/types#discoverenrichfn) | | Finds icons that take an extra request to reach. See [Enriching Platform Icons](/other/favicons#enriching-platform-icons) |
| `extractFn` | `DiscoverExtractFn` | image check | Custom extraction function |
| `resolveUrlFn` | `DiscoverResolveUrlFn` | resolve relative | Custom URL resolution function |
| `resolveSiteUrlFn` | `DiscoverResolveSiteUrlFn` | site link from feed | Resolves the site URL to scan when the input is a feed |
| `stopOnFirstMethod` | `boolean` | `false` | Stop after the first method that finds a valid result |
| `stopOnFirstResult` | `boolean` | `false` | Stop after first valid favicon |
| `concurrency` | `number` | `3` | Max parallel validations |
| `maxUris` | `number` | `50` | Max total candidate URIs to fetch across all methods |
| `includeInvalid` | `boolean` | `false` | Include invalid results |
| `onProgress` | `DiscoverOnProgressFn` | | Progress callback |
| `onStep` | `DiscoverOnStepFn` | | Called when each stage of discovery starts and ends |
| `onError` | `DiscoverOnErrorFn` | | Called when fetching the input or the site URL fails. [`DiscoverOnErrorFn`](/reference/types#discoveronerrorfn) lists everything it reports |

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
  error: Error, // Only set when the request or the extractor threw
  method: 'guess',
}
```

Each favicon URL appears once. When several candidates lead to the same favicon, for example `/favicon.ico` and `/favicon.png` both redirecting to one image, only the first is kept. The same applies to invalid results with `includeInvalid`.

## Examples

### Basic Usage

```typescript
import { discoverFavicons } from 'feedscout'

// Simple usage - all methods enabled by default
const favicons = await discoverFavicons('https://example.com')

// Or specify which methods to use
const favicons = await discoverFavicons('https://example.com', {
  methods: ['html', 'headers', 'guess'],
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
  stopOnFirstResult: true,
})
```

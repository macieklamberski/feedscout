---
outline: 2
prev: discoverFeeds
next: discoverHubs
---

# discoverBlogrolls

Discovers and validates OPML blogrolls from a webpage.

## Signature

```typescript
function discoverBlogrolls(
  input: DiscoverInput,
  options: DiscoverOptions<BlogrollResultValid>,
): Promise<Array<DiscoverResult<BlogrollResultValid>>>
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

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `methods` | `DiscoverMethodsConfig` | | **Required.** Which methods to use |
| `fetchFn` | `DiscoverFetchFn` | native fetch | Custom fetch function |
| `extractFn` | `DiscoverExtractFn` | feedsmith | Custom OPML extraction function |
| `normalizeUrlFn` | `DiscoverNormalizeUrlFn` | | Custom URL normalization function |
| `concurrency` | `number` | `3` | Max parallel validations |
| `stopOnFirstResult` | `boolean` | `false` | Stop after first valid blogroll |
| `includeInvalid` | `boolean` | `false` | Include invalid results |
| `onProgress` | `DiscoverProgressFn` | | Progress callback |

## Return Value

Returns a promise that resolves to an array of results:

```typescript
// Valid result
{
  url: 'https://example.com/blogroll.opml',
  isValid: true,
  title: 'My Reading List',
}

// Invalid result (when includeInvalid: true)
{
  url: 'https://example.com/not-opml.xml',
  isValid: false,
  error: Error,
}
```

## Examples

### Basic Usage

```typescript
import { discoverBlogrolls } from 'feedscout'

const blogrolls = await discoverBlogrolls('https://example.com', {
  methods: ['html', 'headers', 'guess'],
})
```

### With Custom Options

```typescript
import { blogrollUrisComprehensive } from 'feedscout/blogrolls'

const blogrolls = await discoverBlogrolls('https://example.com', {
  methods: {
    html: {
      anchorLabels: ['blogroll', 'opml'],
    },
    guess: {
      uris: blogrollUrisComprehensive,
    },
  },
})
```


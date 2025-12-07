---
outline: 2
prev: discoverHubs
---

# Types

All types are exported from the main `feedscout` package.

```typescript
import type {
  DiscoverInput,
  DiscoverOptions,
  DiscoverResult,
  DiscoverProgress,
  DiscoverFetchFn,
  DiscoverNormalizeUrlFn,
  DiscoverHubsOptions,
  HubResult,
} from 'feedscout'
```

## Input Types

### DiscoverInput

Input for discovery functions. Can be a URL string or an object:

```typescript
type DiscoverInput = string | DiscoverInputObject

type DiscoverInputObject = {
  url: string
  content?: string   // HTML content
  headers?: Headers  // HTTP headers
}
```

## Options Types

### DiscoverOptions

Options for `discoverFeeds` and `discoverBlogrolls`:

```typescript
type DiscoverOptions<TValid> = {
  methods: DiscoverMethodsConfig
  fetchFn?: DiscoverFetchFn
  extractFn?: DiscoverExtractFn<TValid>
  normalizeUrlFn?: DiscoverNormalizeUrlFn
  concurrency?: number
  stopOnFirstResult?: boolean
  includeInvalid?: boolean
  onProgress?: DiscoverProgressFn
}
```

### DiscoverMethodsConfig

Configuration for discovery methods:

```typescript
type DiscoverMethodsConfig =
  | Array<'html' | 'headers' | 'guess'>
  | {
      html?: true | Partial<Omit<HtmlMethodOptions, 'baseUrl'>>
      headers?: true | Partial<Omit<HeadersMethodOptions, 'baseUrl'>>
      guess?: true | Partial<Omit<GuessMethodOptions, 'baseUrl'>>
    }
```

The `baseUrl` is omitted because it's automatically derived from the input URL.

### DiscoverHubsOptions

Options for `discoverHubs`:

```typescript
type DiscoverHubsOptions = {
  methods?: DiscoverHubsMethodsConfig
  fetchFn?: DiscoverFetchFn
}

type DiscoverHubsMethodsConfig = Array<'headers' | 'html' | 'feed'>
```

## Result Types

### DiscoverResult

Result from discovery functions:

```typescript
type DiscoverResult<TValid> =
  | ({ url: string; isValid: true } & TValid)
  | { url: string; isValid: false; error?: unknown }
```

### FeedResultValid

Valid feed result properties:

```typescript
type FeedResultValid = {
  format: 'rss' | 'atom' | 'json' | 'rdf'
  title?: string
  description?: string
  siteUrl?: string
}
```

### BlogrollResultValid

Valid blogroll result properties:

```typescript
type BlogrollResultValid = {
  title?: string
}
```

### HubResult

Result from `discoverHubs`:

```typescript
type HubResult = {
  hub: string   // Hub URL to subscribe to
  topic: string // Feed URL the hub serves updates for
}
```

## Progress Types

### DiscoverProgress

Progress information passed to `onProgress` callback:

```typescript
type DiscoverProgress = {
  tested: number   // Number of URLs tested
  total: number    // Total URLs to test
  found: number    // Valid results found
  current: string  // Current URL being tested
}
```

### DiscoverProgressFn

Progress callback function type:

```typescript
type DiscoverProgressFn = (progress: DiscoverProgress) => void
```

## Fetch Types

### DiscoverFetchFn

Custom fetch function type:

```typescript
type DiscoverFetchFn = (
  url: string,
  options?: DiscoverFetchFnOptions,
) => Promise<DiscoverFetchFnResponse>

type DiscoverFetchFnOptions = {
  method?: 'GET' | 'HEAD'
  headers?: Record<string, string>
}

type DiscoverFetchFnResponse = {
  headers: Headers
  body: string | ReadableStream<Uint8Array>
  url: string
  status: number
  statusText: string
}
```

## Extractor Types

### DiscoverExtractFn

Custom extractor function type:

```typescript
type DiscoverExtractFn<TValid> = (
  input: DiscoverExtractFnInput,
) => Promise<DiscoverResult<TValid>>

type DiscoverExtractFnInput = {
  url: string
  content: string
  headers?: Headers
}
```

## Method Option Types

### HtmlMethodOptions

Options for HTML discovery method:

```typescript
type HtmlMethodOptions = {
  baseUrl?: string
  linkSelectors: Array<LinkSelector>
  anchorUris: Array<string>
  anchorIgnoredUris: Array<string>
  anchorLabels: Array<string>
}

type LinkSelector = {
  rel: string
  types?: Array<string>
}
```

### HeadersMethodOptions

Options for Headers discovery method:

```typescript
type HeadersMethodOptions = {
  baseUrl?: string
  linkSelectors: Array<LinkSelector>
}
```

### GuessMethodOptions

Options for Guess discovery method:

```typescript
type GuessMethodOptions = {
  baseUrl: string
  uris: Array<string>
  additionalBaseUrls?: Array<string>
}
```

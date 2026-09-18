---
title: "Reference: Types"
---

# Types

The shared types are exported from the main `feedscout` package. Result types and platform types come from the path of the discoverer they belong to.

```typescript
import type {
  DiscoverInput,
  DiscoverMethod,
  DiscoverOptions,
  DiscoverResult,
  DiscoverProgress,
  DiscoverFetchFn,
  DiscoverExtractFn,
  DiscoverResolveUrlFn,
  DiscoverResolveSiteUrlFn,
  DiscoverOnProgressFn,
  DiscoverOnErrorFn,
  DiscoverErrorContext,
  DiscoverUriEntry,
  DiscoverUriHint,
  UriEntry,
} from 'feedscout'

import type { FeedResult } from 'feedscout/feeds'
import type { BlogrollResult } from 'feedscout/blogrolls'
import type { FaviconResult } from 'feedscout/favicons'
import type { HubResult, DiscoverHubsOptions } from 'feedscout/hubs'
import type { PlatformHandler, PlatformMethodOptions } from 'feedscout/platform'
```

The [method option types](#method-option-types), `LinkSelector` and `MaybePromise` are not exported by name. They are listed here to describe the shapes that `methods` accepts.

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

Options for discovery functions. All fields are optional for simple usage. The `TMethods` parameter restricts which methods are available. Each discoverer narrows it to its supported methods:

```typescript
type DiscoverOptions<TValid, TMethods extends DiscoverMethod = DiscoverMethod> = {
  methods?: DiscoverMethodsConfig<TMethods>
  fetchFn?: DiscoverFetchFn
  extractFn?: DiscoverExtractFn<TValid>
  resolveUrlFn?: DiscoverResolveUrlFn
  resolveSiteUrlFn?: DiscoverResolveSiteUrlFn
  stopOnFirstMethod?: boolean
  stopOnFirstResult?: boolean
  concurrency?: number
  maxUris?: number
  onProgress?: DiscoverOnProgressFn
  onError?: DiscoverOnErrorFn
  includeInvalid?: boolean
}
```

### DiscoverMethod

Union type of available discovery method names:

```typescript
type DiscoverMethod = 'platform' | 'feed' | 'html' | 'headers' | 'guess'
```

### DiscoverMethodsConfig

Configuration for discovery methods:

```typescript
type DiscoverMethodsConfig<TMethods extends DiscoverMethod = DiscoverMethod> =
  | Array<TMethods>
  | Pick<
      {
        platform?: true | Partial<PlatformMethodOptions>
        feed?: true | Partial<FeedMethodOptions>
        html?: true | Partial<Omit<HtmlMethodOptions, 'baseUrl'>>
        headers?: true | Partial<Omit<HeadersMethodOptions, 'baseUrl'>>
        guess?: true | Partial<Omit<GuessMethodOptions, 'baseUrl'>>
      },
      TMethods
    >
```

The `baseUrl` is omitted because it's automatically derived from the input URL.

### DiscoverHubsOptions

Options for `discoverHubs`:

```typescript
type DiscoverHubsOptions = {
  methods?: DiscoverHubsMethodsConfig
  fetchFn?: DiscoverFetchFn
  resolveUrlFn?: DiscoverResolveUrlFn
}

type DiscoverHubsMethodsConfig = Array<'headers' | 'html' | 'feed'>
```

## Result Types

### DiscoverResult

Result from discovery functions:

```typescript
type DiscoverResult<TValid> =
  | ({
      url: string
      isValid: true
      method?: DiscoverMethod
      hint?: DiscoverUriHint
    } & TValid)
  | {
      url: string
      isValid: false
      method?: DiscoverMethod
      hint?: DiscoverUriHint
      error?: unknown
    }
```

The `method` field indicates which discovery method produced the result (`'platform'`, `'feed'`, `'html'`, `'headers'`, or `'guess'`). See [Platform method hints](/feeds/platform#hints) for details on the `hint` property.

### FeedResult

Valid feed result properties:

```typescript
type FeedResult = {
  format: 'rss' | 'atom' | 'json' | 'rdf'
  title?: string
  description?: string
  siteUrl?: string
}
```

### BlogrollResult

Valid blogroll result properties:

```typescript
type BlogrollResult = {
  title?: string
}
```

### FaviconResult

Valid favicon results carry no extra properties yet:

```typescript
type FaviconResult = {}
```

### HubResult

Result from `discoverHubs`:

```typescript
type HubResult = {
  hub: string   // Hub URL to subscribe to
  topic: string // Feed URL the hub serves updates for
}
```

### DiscoverUriHint

A hint describing the type of feed a URI represents. See [Platform method hints](/feeds/platform#hints) for details:

```typescript
type DiscoverUriHint = {
  key: string
  label: string
}
```

### UriEntry

A URI or array of alternative URIs. When an array, alternatives are tried in order until one validates successfully:

```typescript
type UriEntry = string | Array<string>
```

### DiscoverUriEntry

A URI entry with an optional hint. Used by [platform handlers](/feeds/platform#creating-custom-handlers) to return feed URIs with metadata:

```typescript
type DiscoverUriEntry = {
  uri: UriEntry
  hint?: DiscoverUriHint
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

### DiscoverOnProgressFn

Progress callback function type:

```typescript
type DiscoverOnProgressFn = (progress: DiscoverProgress) => void
```

## Error Types

### DiscoverOnErrorFn

Error callback function type. Called when a request made by discovery itself fails, so the error is not lost:

```typescript
type DiscoverOnErrorFn = (error: unknown, context: DiscoverErrorContext) => void

type DiscoverErrorContext = {
  phase: 'fetchInput' | 'resolveSiteUrl'
  url?: string
}
```

- `fetchInput`: Fetching the input URL failed. Discovery continues with the URL alone. Platform and Guess still run. HTML, Headers and Feed throw, because they need the content or headers.
- `resolveSiteUrl`: Fetching the site URL taken from a feed failed. Discovery continues with the original input.

## Fetch Types

### DiscoverFetchFn

Custom fetch function type:

```typescript
type DiscoverFetchFn = (
  url: string,
  options?: DiscoverFetchFnOptions,
) => MaybePromise<DiscoverFetchFnResponse>

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
type DiscoverExtractFn<TValid> = (input: {
  url: string
  content: string
  headers?: Headers
  status?: number
}) => MaybePromise<DiscoverResult<TValid>>
```

The `status` is the HTTP status of the fetched URL. It is not set when the extractor runs on content passed in as input.

## URL Resolution Types

### DiscoverResolveUrlFn

Custom URL resolution function type. Return `undefined` to keep the URL as discovered:

```typescript
type DiscoverResolveUrlFn = (url: string, baseUrl: string | undefined) => string | undefined
```

### DiscoverResolveSiteUrlFn

Resolves the site URL to scan when the input is a feed. Used by `discoverBlogrolls` and `discoverFavicons`, where the default reads the site link from the feed and falls back to the origin of the feed URL. Return `undefined` to scan the input as is:

```typescript
type DiscoverResolveSiteUrlFn = (
  input: DiscoverInputObject,
  resolveUrlFn: DiscoverResolveUrlFn,
) => string | undefined
```

## Method Option Types

### FeedMethodOptions

Options for Feed discovery method:

```typescript
type FeedMethodData = ReturnType<typeof parseFeed>

type FeedMethodOptions = {
  extractUrls: (params: FeedMethodData) => Array<string>
}
```

`FeedMethodData` is the return type of Feedsmith's `parseFeed`. It contains `format` (e.g. `'atom'`, `'json'`) and `feed` (the parsed feed object). The `extractUrls` callback should return an array of URLs. For favicons, the default extractor pulls `icon` from Atom feeds and `favicon`/`icon` from JSON Feeds.

### HtmlMethodOptions

Options for HTML discovery method:

```typescript
type HtmlMethodOptions = {
  baseUrl?: string
  linkSelectors: Array<LinkSelector>
  anchorUris: Array<Pattern>
  anchorPathSegments?: Array<Pattern>
  anchorIgnoredUris: Array<Pattern>
  anchorLabels: Array<Pattern>
  anchorAttributes?: Array<string>
}

type Pattern = string | RegExp

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
  uris: Array<UriEntry>
  additionalBaseUrls?: Array<string>
}
```

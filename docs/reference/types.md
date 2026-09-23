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
  DiscoverStep,
  DiscoverOnStepFn,
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

The [method option types](#method-option-types) and `LinkSelector` are not exported by name. They are listed here to describe the shapes that `methods` accepts.

## Input Types

### DiscoverInput

Input for discovery functions. Can be a URL string or an object:

```typescript
type DiscoverInput = string | DiscoverInputObject

type DiscoverInputObject = {
  url: string
  content?: string   // HTML content
  headers?: Headers  // HTTP headers
  status?: number    // HTTP status of the response the content came from
}
```

When the input is a URL, `status` is set from the response. The default extractors reject an input whose status is outside the 2xx range, so a feed URL that answers 404 with a feed body is not returned as a result. Discovery then carries on with the methods, as it does for any input that is not a feed. Leave `status` out when you pass content you already trust.

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
  onProgress?: DiscoverOnProgressFn<TValid>
  onStep?: DiscoverOnStepFn
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

The `baseUrl` is omitted because it's set for you: the input URL, or the site URL when the input is a feed.

### DiscoverHubsOptions

Options for `discoverHubs`:

```typescript
type DiscoverHubsOptions = {
  methods?: DiscoverHubsMethodsConfig
  fetchFn?: DiscoverFetchFn
  resolveUrlFn?: DiscoverResolveUrlFn
  onError?: DiscoverOnErrorFn
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

The `method` field indicates which discovery method produced the result (`'platform'`, `'feed'`, `'html'`, `'headers'`, or `'guess'`). It is absent when the input itself is a valid feed, because no method produced that result. See [Platform method hints](/feeds/platform#hints) for details on the `hint` property.

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

Progress information passed to the `onProgress` callback after each candidate URL is tested:

```typescript
type DiscoverProgress<TValid = object> = {
  tested: number                  // Number of URLs tested
  total: number                   // Total URLs to test
  found: number                   // Valid results found
  current: string                 // URL that was just tested
  method: DiscoverMethod          // Method the URL came from
  result: DiscoverResult<TValid>  // Result of testing the URL, with its hint
}
```

Every tested URL is reported, including one that led to a URL an earlier result already returned. Such a repeat comes with a valid `result` but does not raise `found`, and it is left out of the returned results. To build a list of feeds as they are found, add one when `found` goes up.

### DiscoverOnProgressFn

Progress callback function type:

```typescript
type DiscoverOnProgressFn<TValid = object> = (progress: DiscoverProgress<TValid>) => void
```

### DiscoverStep

A stage of discovery, passed to the `onStep` callback when it starts and when it ends:

```typescript
type DiscoverStep =
  | { step: 'fetchInput' | 'resolveSiteUrl'; status: 'start' | 'end'; url: string }
  | { step: 'collect'; status: 'start' | 'end' }
  | { step: 'validate'; status: 'start'; method: DiscoverMethod; total: number }
  | { step: 'validate'; status: 'end'; method: DiscoverMethod; total: number; found: number }
```

- `fetchInput`: Fetching the input URL. Skipped when you pass the content in.
- `resolveSiteUrl`: Fetching the site page of a feed, when `resolveSiteUrlFn` returns one.
- `collect`: Gathering candidate URLs from every method. Platform handlers that fetch a page to build their URLs do it here.
- `validate`: Testing the candidates of one method. Every method that ran gets one, including a method that found nothing to test, which reports a `total` of 0. A method skipped by `stopOnFirstMethod` or `stopOnFirstResult` gets none.

### DiscoverOnStepFn

Step callback function type:

```typescript
type DiscoverOnStepFn = (step: DiscoverStep) => void
```

## Error Types

### DiscoverOnErrorFn

Error callback function type. Called when discovery hits a failure it can continue past, so the error is not lost:

```typescript
type DiscoverOnErrorFn = (error: unknown, context: DiscoverErrorContext) => void

type DiscoverErrorContext = {
  phase:
    | 'fetchInput'
    | 'resolveSiteUrl'
    | 'resolveUrlFn'
    | 'resolveSiteUrlFn'
    | 'extractFn'
    | 'onProgress'
    | 'onStep'
  url?: string
}
```

- `fetchInput`: Fetching the input URL failed. Methods that need its content or headers are skipped, and discovery continues with the rest, so Platform and Guess still run on a host that is down. A fetch that worked is different, and so is an input object you pass in: a method left without content or headers there is a usage error and throws.
- `resolveSiteUrl`: Fetching the site URL taken from a feed failed. Discovery continues with the original input.
- `resolveUrlFn`: The URL resolution function threw. The URL is kept as discovered.
- `resolveSiteUrlFn`: The site URL resolution function threw. Discovery continues with the original input.
- `extractFn`: The extractor threw on the input content. The input is not returned as a result, and the methods run.
- `onProgress`: The progress callback threw, or returned a promise that rejected. The result it was called for is kept.
- `onStep`: The step callback threw, or returned a promise that rejected. Discovery continues.

A function you pass in never ends discovery by throwing. The phases above are reported here. A throw from `fetchFn` or `extractFn` on a candidate URL is not: it marks that result as invalid and lands in its `error` field, which you see with `includeInvalid`. A throw inside a platform handler, from its `match` or `resolve`, is not reported either: that handler is skipped silently and the next one is tried. The default `resolveUrlFn` is reported the same way as a custom one, for example when a page links to a malformed absolute URL. `resolveUrlFn` and `resolveSiteUrlFn` are synchronous: one that returns a promise is treated as returning nothing, and a rejection is reported. An error thrown from `onError` itself is ignored, and so is a promise it returns that rejects.

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

The `status` is the HTTP status of the fetched URL. It is not set when the extractor runs on the input itself, whether you passed the content in or Feedscout fetched it.

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
type FeedMethodData = ReturnType<typeof parseFeed<string>>

type FeedMethodOptions = {
  extractUrls: (params: FeedMethodData) => Array<string> | undefined
}
```

`FeedMethodData` is the return type of Feedsmith's `parseFeed`. It contains `format` (e.g. `'atom'`, `'json'`) and `feed` (the parsed feed object). The `extractUrls` callback should return an array of URLs, or `undefined` when it finds none. For favicons, the default extractor pulls `icon` and `itunes:image` from Atom feeds, `itunes:image` from RSS feeds, and `favicon`/`icon` from JSON Feeds.

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
  maxAncestorDepth?: number
  content?: string
  sectionNames?: Array<string>
}
```

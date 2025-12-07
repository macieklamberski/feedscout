---
outline: 2
prev: Quick Start
next: Discover Feeds
---

# TypeScript

Feedscout is written in TypeScript and exports comprehensive type definitions.

## Type Imports

Import types alongside functions:

```typescript
import type {
  DiscoverInput,
  DiscoverOptions,
  DiscoverResult,
  DiscoverProgress,
} from 'feedscout'

import { discoverFeeds } from 'feedscout'
```

## Working with Results

### Type Narrowing

Use `isValid` to narrow the result type:

```typescript
const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  includeInvalid: true,
})

for (const feed of feeds) {
  if (feed.isValid) {
    // TypeScript knows these properties exist
    console.log(feed.format)      // 'rss' | 'atom' | 'json' | 'rdf'
    console.log(feed.title)       // string | undefined
    console.log(feed.description) // string | undefined
    console.log(feed.siteUrl)     // string | undefined
  } else {
    // TypeScript knows this is an invalid result
    console.log(feed.error) // unknown
  }
}
```

### Feed Result Type

Valid feed results have these properties:

```typescript
type FeedResultValid = {
  format: 'rss' | 'atom' | 'json' | 'rdf'
  title?: string
  description?: string
  siteUrl?: string
}
```

### Blogroll Result Type

Valid blogroll results have these properties:

```typescript
type BlogrollResultValid = {
  title?: string
}
```

## Generic Options

The `DiscoverOptions` type is generic to support custom extractors:

```typescript
// Default usage with FeedResultValid
const options: DiscoverOptions<FeedResultValid> = {
  methods: ['html', 'guess'],
}

// Custom extractor with different result type
type CustomResult = {
  customField: string
}

const options: DiscoverOptions<CustomResult> = {
  methods: ['html'],
  extractFn: async ({ url, content }) => {
    return {
      url,
      isValid: true,
      customField: 'value',
    }
  },
}
```

## Method Options

Each discovery method has its own options type:

```typescript
import type { HtmlMethodOptions } from 'feedscout/feeds'

const htmlOptions: Partial<Omit<HtmlMethodOptions, 'baseUrl'>> = {
  anchorLabels: ['rss', 'feed'],
  anchorUris: ['/feed', '/rss'],
}
```

## Fetch Function Type

Custom fetch functions must match `DiscoverFetchFn`:

```typescript
import type { DiscoverFetchFn } from 'feedscout'

const customFetch: DiscoverFetchFn = async (url, options) => {
  const response = await myClient.request(url, options)

  return {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
    body: response.data,
  }
}
```

## Progress Callback Type

The progress callback receives `DiscoverProgress`:

```typescript
import type { DiscoverProgressFn, DiscoverProgress } from 'feedscout'

const onProgress: DiscoverProgressFn = (progress: DiscoverProgress) => {
  console.log(`${progress.tested}/${progress.total}`)
}
```

## Export Paths

Types are available from multiple export paths:

```typescript
// Main types
import type { DiscoverResult, DiscoverOptions } from 'feedscout'

// Feed-specific types
import type { FeedResultValid } from 'feedscout/feeds'

// Blogroll-specific types
import type { BlogrollResultValid } from 'feedscout/blogrolls'

// Hub-specific types
import type { HubResult, DiscoverHubsOptions } from 'feedscout/hubs'
```

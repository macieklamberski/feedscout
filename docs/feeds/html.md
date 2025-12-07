---
outline: 2
prev: Discover Feeds
next: Headers Method
---

# HTML Method

The HTML method extracts feed URLs from HTML content by scanning link elements and anchor tags.

Follows [RSS Board Autodiscovery](https://www.rssboard.org/rss-autodiscovery) and [WHATWG Feed Autodiscovery](https://blog.whatwg.org/feed-autodiscovery) specs.

## How It Works

The HTML method scans two types of elements:

### Link Elements

Looks for `<link>` elements that advertise feeds:

```html
<!-- rel="alternate" with feed MIME type -->
<link rel="alternate" type="application/rss+xml" href="/feed.xml" />

<!-- rel="feed" (WHATWG spec) -->
<link rel="feed" href="/feed" />
```

### Anchor Elements

Scans `<a>` tags for feed links using two strategies:

1. **URI matching** — Checks if `href` contains common feed paths like `/feed`, `/rss.xml`.
2. **Label matching** — Checks if link text contains words like "RSS", "Feed", "Subscribe".

```html
<!-- Matched by URI -->
<a href="/feed.xml">XML</a>

<!-- Matched by label -->
<a href="/subscribe">RSS Feed</a>
```

## Configuration

Feedscout comes with reasonable defaults, but you can customize how HTML is parsed if needed.

### Link Selectors

Control which `<link>` elements are matched:

```typescript
import { feedMimeTypes } from 'feedscout/feeds'

const feeds = await discoverFeeds(url, {
  methods: {
    html: {
      linkSelectors: [
        { rel: 'alternate', types: feedMimeTypes },
        { rel: 'feed' },
      ],
    },
  },
})
```

### Anchor URIs

Specify URI patterns to match in anchor `href` attributes:

```typescript
const feeds = await discoverFeeds(url, {
  methods: {
    html: {
      anchorUris: ['/feed', '/rss', '/atom', '/rss.xml', '/feed.xml'],
    },
  },
})
```

### Anchor Labels

Specify text patterns to match in anchor content:

```typescript
const feeds = await discoverFeeds(url, {
  methods: {
    html: {
      anchorLabels: ['rss', 'feed', 'atom', 'subscribe'],
    },
  },
})
```

### Ignored URIs

Exclude certain URI patterns from anchor matching:

```typescript
const feeds = await discoverFeeds(url, {
  methods: {
    html: {
      anchorIgnoredUris: ['wp-json/oembed/', 'wp-json/wp/'],
    },
  },
})
```

## Default Values

You can import the default HTML options:

```typescript
import { defaultHtmlOptions } from 'feedscout/feeds'
```

The defaults include comprehensive anchor URIs and common feed-related labels. You can also import individual pieces:

```typescript
import {
  linkSelectors,
  anchorLabels,
  feedUrisComprehensive,
  ignoredUris,
} from 'feedscout/feeds'
```

## Using Directly

You can use the HTML discovery function directly to get URIs without validation:

```typescript
import { discoverUrisFromHtml } from 'feedscout/methods'

const uris = discoverUrisFromHtml(htmlContent, {
  baseUrl: 'https://example.com',
  linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
  anchorUris: ['/feed'],
  anchorLabels: ['rss'],
  anchorIgnoredUris: [],
})

// [
//   'https://example.com/feed.xml',
//   'https://example.com/rss',
// ]
```

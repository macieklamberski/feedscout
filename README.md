# Feedscout

[![codecov](https://codecov.io/gh/macieklamberski/feedscout/branch/main/graph/badge.svg)](https://codecov.io/gh/macieklamberski/feedscout)
[![npm version](https://img.shields.io/npm/v/feedscout.svg)](https://www.npmjs.com/package/feedscout)
[![license](https://img.shields.io/npm/l/feedscout.svg)](https://github.com/macieklamberski/feedscout/blob/main/LICENSE)

Advanced feed autodiscovery for JavaScript. Collect feeds from webpages using multiple discovery methods.

**[Read full docs ↗](https://feedscout.dev)**
&nbsp;&nbsp;·&nbsp;&nbsp;
[Quick Start](#quick-start)

---

## Overview

Feedscout makes it easy to discover feeds from webpages using multiple methods.

### HTML Discovery

Extracts feed URIs from HTML content using multiple strategies:

- **Link elements** — `<link rel="alternate">` with feed MIME types and `<link rel="feed">` elements
- **Anchor elements** — `<a href="…">` matching `/feed`, `/rss.xml` or containing "RSS", "Subscribe", etc.

This method uses [htmlparser2](https://github.com/fb55/htmlparser2) for efficient parsing. Follows [RSS Board](https://www.rssboard.org/rss-autodiscovery) and [WHATWG](https://blog.whatwg.org/feed-autodiscovery) specs.

### HTTP Headers Discovery

Parses HTTP `Link` headers for `rel="alternate"` with feed MIME types per [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288). Useful when feeds are advertised via HTTP headers rather than HTML metadata.

### Guess Method

Tests common feed paths (`/feed`, `/rss.xml`, `/atom.xml`, etc.) against the base URL. Useful as fallback when other methods fail.

## Quick Start

```bash
npm install feedscout
```

### Basic Usage

Given HTML content on https://example.com:

```html
<html>
  <head>
    <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
  </head>
  <body>
    <a href="/rss">RSS Feed</a>
  </body>
</html>
```

Feedscout discovers and extracts feeds data:

```typescript
import { discoverFeeds } from 'feedscout'

const feeds = await discoverFeeds(
  { url: 'https://example.com', content: html },
  { methods: ['html', 'guess'] },
)

// [{ url: 'https://example.com/feed.xml', isValid: true, format: 'rss', title: '...' }]
```

By default, native `fetch()` is used. For projects using other HTTP libraries, adapters are available:

```typescript
import axios from 'axios'
import { createAxiosAdapter } from 'feedscout/adapters'

const feeds = await discoverFeeds(input, {
  methods: ['html', 'guess'],
  fetchFn: createAxiosAdapter(axios),
})
```

| Adapter | Library |
|---------|---------|
| `createNativeFetchAdapter` | Native `fetch` (default) |
| `createAxiosAdapter` | [axios](https://axios-http.com) |
| `createGotAdapter` | [got](https://github.com/sindresorhus/got) |
| `createKyAdapter` | [ky](https://github.com/sindresorhus/ky) |


### Using Existing Response Data

If you already have the response, you can provide it directly instead of fetching the data again:

```typescript
const feeds = await discoverFeeds(
  {
    url: 'https://example.com',
    content: htmlContent,
    headers: responseHeaders,
  },
  {
    methods: ['html', 'headers', 'guess'],
  },
)
```

### Custom Options with Object Syntax

If you want more control over what types of links, anchors or labels are treated as feeds, use object syntax to customize method options:

```typescript
const feeds = await discoverFeeds('https://example.com', {
    methods: {
      html: {
        anchorLabels: ['rss', 'feed', 'subscribe'],
        anchorUris: ['/feed', '/rss'],
      },
      headers: true, // Use defaults
      guess: {
        uris: ['/custom-feed', '/blog/rss'],
      },
    },
    concurrency: 5,
    stopOnFirst: true,
  }
)
```

For all available options, [visit the reference page in documentation ↗](https://feedscout.dev).

# Feedscout

[![codecov](https://codecov.io/gh/macieklamberski/feedscout/branch/main/graph/badge.svg)](https://codecov.io/gh/macieklamberski/feedscout)
[![npm version](https://img.shields.io/npm/v/feedscout.svg)](https://www.npmjs.com/package/feedscout)
[![license](https://img.shields.io/npm/l/feedscout.svg)](https://github.com/macieklamberski/feedscout/blob/main/LICENSE)

Advanced feed autodiscovery for JavaScript. Collect feed information from any webpage using multiple discovery methods.

Finds feeds by scanning links and anchors in HTML content, parsing HTTP headers, and guessing common paths, then validates each URL by fetching and parsing the feed.

**[Read full docs ↗](https://feedscout.dev)**
&nbsp;&nbsp;·&nbsp;&nbsp;
[Quick Start](#quick-start)

---

## Features

### Supported Content

- **Feeds** — RSS, Atom, JSON Feed, and RDF. Each feed is validated and returns metadata like format, title, description, and site URL.
- **Blogrolls** — OPML files containing feed subscriptions. Validated and returns title.
- **WebSub hubs** — Find hubs for real-time feed update notifications.

### Discovery Methods

- **HTML** — Scans `<link>` elements with feed MIME types and `<a>` elements matching feed patterns or labels like "RSS", "Subscribe".
- **Headers** — Parses HTTP `Link` headers for `rel="alternate"` with feed MIME types per RFC 8288.
- **Guess** — Tests common paths (e.g. `/feed`, `/rss.xml`, `/atom.xml`) against the base URL as a fallback.

### Customization

- **Custom extractors** — Override the default parser to extract additional metadata from feeds and blogrolls.
- **Configurable methods** — Enable/disable discovery methods or customize their options.
- **Adapter system** — Use native fetch or easily integrate with Axios, Got, or Ky.
- **Concurrency control** — Limit parallel requests during validation.
- **Progress tracking** — Monitor discovery progress with callbacks.
- **Type-safe** — Full TypeScript support with exported types.
- **Tree-shakable** — Import only what you need.

## Quick Start

This is a short guide on how to get you up and running with Feedscout.

For a full overview of all the features, [visit the documentation](https://feedscout.dev).

### Installation

```bash
npm install feedscout
```

### Discover Feeds

```typescript
import { discoverFeeds } from 'feedscout'

const feeds = await discoverFeeds('https://example.com', {
  methods: ['html', 'headers'],
})

// [{
//   url: 'https://example.com/feed.xml',
//   isValid: true,
//   format: 'rss',
//   title: 'Example Blog',
//   description: 'A blog about examples',
//   siteUrl: 'https://example.com',
// }]
```

Or with existing HTML content:

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

```typescript
const feeds = await discoverFeeds(
  { url: 'https://example.com', content: html },
  { methods: ['html'] },
)

// [
//   {
//     url: 'https://example.com/feed.xml',
//     isValid: true,
//     format: 'rss',
//     title: 'Example Blog',
//     description: 'A blog about examples',
//     siteUrl: 'https://example.com',
//   },
//   {
//     url: 'https://example.com/rss',
//     isValid: true,
//     format: 'rss',
//     title: 'Example Blog',
//     description: 'A blog about examples',
//     siteUrl: 'https://example.com',
//   },
// ]
```

Or with HTTP headers:

```http
Link: </feed.xml>; rel="alternate"; type="application/rss+xml"
```

```typescript
const feeds = await discoverFeeds(
  { url: 'https://example.com', headers },
  { methods: ['headers'] },
)

// [{
//   url: 'https://example.com/feed.xml',
//   isValid: true,
//   format: 'rss',
//   title: 'Example Blog',
//   description: 'A blog about examples',
//   siteUrl: 'https://example.com',
// }]
```

### Discover Blogrolls

```typescript
import { discoverBlogrolls } from 'feedscout'

const blogrolls = await discoverBlogrolls('https://example.com', {
  methods: ['html'],
})

// [{
//   url: 'https://example.com/blogroll.opml',
//   isValid: true,
//   title: 'My Blogroll',
// }]
```

### Discover WebSub Hubs

```typescript
import { discoverHubs } from 'feedscout'

const hubs = await discoverHubs('https://example.com/feed.xml')

// [{
//   hub: 'https://pubsubhubbub.appspot.com',
//   topic: 'https://example.com/feed.xml',
// }]
```

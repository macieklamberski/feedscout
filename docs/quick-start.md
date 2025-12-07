---
outline: 2
prev: Introduction
next: TypeScript
---

# Quick Start

This guide will get you up and running with Feedscout in just a few minutes.

## Installation

Feedscout works in both Node and modern browsers as either CommonJS or ES module.

Install the package using your preferred package manager:

::: code-group

```bash [npm]
npm install feedscout
```

```bash [yarn]
yarn add feedscout
```

```bash [pnpm]
pnpm add feedscout
```

```bash [bun]
bun add feedscout
```

:::

## Discover Feeds

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

### Using Existing Content

If you already have the HTML content and/or headers, pass them directly to avoid an extra fetch:

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

## Discover Blogrolls

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

The same existing content pattern works here — pass `{ url, content, headers }` to avoid extra fetches.

## Discover WebSub Hubs

```typescript
import { discoverHubs } from 'feedscout'

const hubs = await discoverHubs('https://example.com/feed.xml')

// [{
//   hub: 'https://pubsubhubbub.appspot.com',
//   topic: 'https://example.com/feed.xml',
// }]
```

The same existing content pattern works here — pass `{ url, content, headers }` to avoid extra fetches.

## Next Steps

- Learn about [feed discovery](/feeds/) in detail.
- Discover [Blogrolls](/other/blogrolls) and [WebSub Hubs](/other/hubs).
- Use different HTTP clients with [HTTP Adapters](/advanced/http-adapters).
- See the full [API Reference](/reference/).

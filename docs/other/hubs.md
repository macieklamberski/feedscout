---
prev: Discover Blogrolls
next: HTTP Adapters
---

# Discover WebSub Hubs

Feedscout can discover WebSub (formerly PubSubHubbub) hubs from feeds and webpages. Hubs enable real-time notifications when content is updated.

## What Is WebSub?

[WebSub](https://www.w3.org/TR/websub/) is a protocol for real-time content updates. A hub acts as an intermediary between publishers and subscribers:

1. Publishers notify the hub when content changes.
2. Subscribers receive instant updates from the hub.

Each hub result contains:

- **hub** — The hub URL to subscribe to.
- **topic** — The feed URL that the hub serves updates for.

## Basic Usage

```typescript
import { discoverHubs } from 'feedscout'

const hubs = await discoverHubs('https://example.com/feed.xml', {
  methods: ['headers', 'feed', 'html'],
})
```

Each result contains the hub and topic URLs:

```typescript
{
  hub: 'https://pubsubhubbub.appspot.com',
  topic: 'https://example.com/feed.xml',
}
```

## Discovery Methods

Unlike feed discovery, hub discovery uses three different methods:

| Method | Source | Description |
|--------|--------|-------------|
| `headers` | HTTP `Link` headers | Parses `rel="hub"` and `rel="self"` links |
| `feed` | Feed content | Extracts hub links from Atom, RSS, or JSON Feed |
| `html` | HTML content | Scans for `<link rel="hub">` elements |

### Headers Method

Parses HTTP `Link` headers for hub information:

```http
Link: <https://pubsubhubbub.appspot.com>; rel="hub"
Link: <https://example.com/feed.xml>; rel="self"
```

### Feed Method

Extracts hub links from feed content:

**Atom feeds:**

```jsx
<feed xmlns="http://www.w3.org/2005/Atom">
  <link rel="hub" href="https://pubsubhubbub.appspot.com" />
  <link rel="self" href="https://example.com/feed.xml" />
</feed>

// [{
//   hub: 'https://pubsubhubbub.appspot.com',
//   topic: 'https://example.com/feed.xml',
// }]
```

**RSS feeds with Atom namespace:**

```jsx
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <atom:link rel="hub" href="https://pubsubhubbub.appspot.com" />
    <atom:link rel="self" href="https://example.com/feed.xml" />
  </channel>
</rss>

// [{
//   hub: 'https://pubsubhubbub.appspot.com',
//   topic: 'https://example.com/feed.xml',
// }]
```

**JSON Feed:**

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "feed_url": "https://example.com/feed.json",
  "hubs": [
    { "type": "WebSub", "url": "https://pubsubhubbub.appspot.com" }
  ]
}

// [{
//   hub: 'https://pubsubhubbub.appspot.com',
//   topic: 'https://example.com/feed.json',
// }]
```

### HTML Method

Scans for `<link>` elements in HTML:

```html
<link rel="hub" href="https://pubsubhubbub.appspot.com" />
<link rel="self" href="https://example.com/feed.xml" />
```

## Specifying Methods

Control which methods to use:

```typescript
// Use all methods
const hubs = await discoverHubs(feedUrl, {
  methods: ['headers', 'feed', 'html'],
})

// Feed content only
const hubs = await discoverHubs(feedUrl, {
  methods: ['feed'],
})
```

## Using Existing Content

If you already have the content and headers, pass them directly:

```typescript
const response = await fetch('https://example.com/feed.xml')
const content = await response.text()

const hubs = await discoverHubs(
  {
    url: 'https://example.com/feed.xml',
    content: await response.text(),
    headers: response.headers,
  },
  {
    methods: ['headers', 'feed'],
  },
)
```

## Custom Fetch Function

Use a custom HTTP client:

```typescript
import { createAxiosAdapter } from 'feedscout/adapters'
import axios from 'axios'

const hubs = await discoverHubs(feedUrl, {
  methods: ['headers', 'feed'],
  fetchFn: createAxiosAdapter(axios),
})
```

## Specifications

Hub discovery follows these specifications:

- [WebSub (W3C Recommendation)](https://www.w3.org/TR/websub/)
- [JSON Feed hubs](https://jsonfeed.org/version/1.1)

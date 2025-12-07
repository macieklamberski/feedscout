---
outline: 2
prev: HTML Method
next: Guess Method
---

# Headers Method

The Headers method extracts feed URLs from HTTP `Link` headers per [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288).

## How It Works

Some servers advertise feeds via HTTP headers instead of (or in addition to) HTML:

```http
HTTP/1.1 200 OK
Link: </feed.xml>; rel="alternate"; type="application/rss+xml"
Link: </atom.xml>; rel="alternate"; type="application/atom+xml"
```

The Headers method parses these headers and extracts feed URLs.

## Configuration

Feedscout comes with reasonable defaults, but you can customize how headers are parsed if needed.

### Link Selectors

Control which `Link` headers are matched:

```typescript
import { feedMimeTypes } from 'feedscout/feeds'

const feeds = await discoverFeeds(url, {
  methods: {
    headers: {
      linkSelectors: [
        { rel: 'alternate', types: feedMimeTypes },
        { rel: 'feed' },
      ],
    },
  },
})
```

## Default Values

You can import the default Headers options:

```typescript
import { defaultHeadersOptions } from 'feedscout/feeds'
```

Or import individual pieces like `linkSelectors`:

```typescript
import { linkSelectors } from 'feedscout/feeds'
```

## Using Directly

You can use the Headers discovery function directly:

```typescript
import { discoverUrisFromHeaders } from 'feedscout/methods'

const uris = discoverUrisFromHeaders(headers, {
  baseUrl: 'https://example.com',
  linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
})

// ['https://example.com/feed.xml']
```

## Providing Headers

When using `discoverFeeds()`, you can provide headers from an existing response:

```typescript
const response = await fetch('https://example.com')

const feeds = await discoverFeeds(
  {
    url: 'https://example.com',
    content: await response.text(),
    headers: response.headers,
  },
  { methods: ['html', 'headers'] },
)
```

## When to Use

The Headers method is useful when:

- The server doesn't include feed links in HTML.
- You want to check for feeds without parsing the full HTML.
- The feed URL is only advertised via headers.

Most websites use HTML `<link>` elements, so the Headers method is typically used as a secondary source.

---
outline: 2
---

# Feedscout

Advanced feed autodiscovery for JavaScript. Collect feeds from webpages using multiple discovery methods.

Finds feeds by scanning links and anchors in HTML content, parsing HTTP headers, and guessing common paths, then validates each URL by fetching and parsing the feed.

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

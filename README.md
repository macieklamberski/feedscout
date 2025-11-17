# Feedscout

[![codecov](https://codecov.io/gh/macieklamberski/feedscout/branch/main/graph/badge.svg)](https://codecov.io/gh/macieklamberski/feedscout)
[![npm version](https://img.shields.io/npm/v/feedscout.svg)](https://www.npmjs.com/package/feedscout)
[![license](https://img.shields.io/npm/l/feedscout.svg)](https://github.com/macieklamberski/feedscout/blob/main/LICENSE)

Advanced feed autodiscovery for JavaScript. Collect feed URIs from webpages using multiple discovery methods.

> **Work in Progress:** This library is under active development. The API may change before reaching v1.0.

## Overview

Feedscout makes it easy to collect all feed URIs from webpages using multiple discovery methods.

### HTML Discovery

Extracts feed URIs from HTML content using multiple strategies:

- **Standard autodiscovery** — `<link rel="alternate">` with feed MIME types
- **HTML5 feeds** — `<link rel="feed">` elements
- **Anchor patterns** — Links matching `/feed`, `/rss.xml`, etc.
- **Anchor text** — Links containing "RSS", "Subscribe", etc.

The library uses [htmlparser2](https://github.com/fb55/htmlparser2) for efficient HTML parsing with low memory footprint (streaming support on the roadmap).

Implementation follows [RSS Board](https://www.rssboard.org/rss-autodiscovery), [WHATWG](https://blog.whatwg.org/feed-autodiscovery), and [historical best practices](https://web.archive.org/web/20100620085023/http://diveintomark.org/archives/2002/08/15/ultraliberal_rss_locator) for feed autodiscovery.

### HTTP Headers Discovery

Extracts feed URIs from HTTP `Link` headers according to [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288) (Web Linking). Parses `Link` headers for relations with `rel="alternate"` and feed MIME types, enabling server-side feed autodiscovery without HTML parsing.

This approach is useful when feeds are advertised via HTTP headers rather than HTML metadata, and provides an additional discovery method alongside the HTML-based.

## Installation

```bash
npm install feedscout
```

## Usage

### Quick Start

Use the main orchestrator to combine multiple discovery methods:

```typescript
import { discoverFeedUris } from 'feedscout'

const html = `
  <html>
    <head>
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
    </head>
    <body>
      <a href="/rss">RSS Feed</a>
    </body>
  </html>
`

const headers = new Headers({
  'Link': '</atom.xml>; rel="alternate"; type="application/atom+xml"'
})

const uris = discoverFeedUris(html, headers, {
  html: {
    linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
    anchorUris: ['/feed', '/rss', '/rss.xml'],
    anchorIgnoredUris: ['wp-json/', 'comments'],
    anchorLabels: ['rss', 'feed', 'subscribe'],
  },
  headers: {
    linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
  },
})

console.log(uris) // ['/feed.xml', '/rss', '/atom.xml']
```

### HTML Discovery

For HTML-only discovery, use `discoverFeedUrisFromHtml`:

```typescript
import { discoverFeedUrisFromHtml } from 'feedscout'

const html = `
  <html>
    <head>
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
    </head>
    <body>
      <a href="/rss">RSS Feed</a>
    </body>
  </html>
`

const uris = discoverFeedUrisFromHtml(html, {
  linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
  anchorUris: ['/feed', '/rss', '/rss.xml'],
  anchorIgnoredUris: ['wp-json/', 'comments'],
  anchorLabels: ['rss', 'feed', 'subscribe'],
})

console.log(uris) // ['/feed.xml', '/rss']
```

### HTTP Headers Discovery

```typescript
import { discoverFeedUrisFromHeaders } from 'feedscout'

const headers = new Headers({
  'Link': '</feed.xml>; rel="alternate"; type="application/rss+xml", </atom.xml>; rel="alternate"; type="application/atom+xml"'
})

const uris = discoverFeedUrisFromHeaders(headers, {
  linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
})

console.log(uris) // ['/feed.xml', '/atom.xml']
```

## Notes

Returned URIs may be relative. Resolve to absolute URLs using `new URL(uri, baseUrl)`.

Identical URIs are deduplicated, but variations like `http://` vs `https://` are preserved.

## API Reference

### `discoverFeedUris(html, headers?, options?)`

Main orchestrator that combines multiple discovery methods.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `html` | `string` | Yes | HTML content to parse |
| `headers` | `Headers` | No | Native Headers object from fetch API |
| `options` | `DiscoverFeedUrisOptions` | No | Discovery configuration |

**Returns:** `string[]` — Array of discovered feed URIs (may be relative)

**Behavior:**
- When called with only `html`: Returns empty array (requires options)
- When called with `html` and `options.html`: Runs HTML discovery
- When called with `html`, `headers`, and both `options.html` and `options.headers`: Runs both methods and deduplicates results
- Can filter methods using `options.methods` array

#### `DiscoverFeedUrisOptions`

| Property | Type | Description |
|----------|------|-------------|
| `methods` | `Array<'html' \| 'headers'>` | Optional. Methods to enable. Defaults to all available methods. |
| `html` | `HtmlDiscoveryOptions` | Optional. Options for HTML discovery. Required if HTML discovery is enabled. |
| `headers` | `HeadersDiscoveryOptions` | Optional. Options for headers discovery. Required if headers discovery is enabled. |

**Example:**

```typescript
const options: DiscoverFeedUrisOptions = {
  methods: ['html', 'headers'], // Optional: explicitly enable both
  html: {
    linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
    anchorUris: ['/feed', '/rss'],
    anchorIgnoredUris: ['comments'],
    anchorLabels: ['rss', 'feed'],
  },
  headers: {
    linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
  },
}
```

---

### `discoverFeedUrisFromHtml(html, options)`

Discovers feed URIs from HTML content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `html` | `string` | Yes | HTML content to parse |
| `options` | `HtmlDiscoveryOptions` | Yes | Discovery configuration |

**Returns:** `string[]` — Array of discovered feed URIs (may be relative)

#### `HtmlDiscoveryOptions`

All options are **required**. Configure each discovery strategy explicitly.

| Property | Type | Description |
|----------|------|-------------|
| `linkMimeTypes` | `string[]` | MIME types to match in `<link type="...">` attributes |
| `anchorUris` | `string[]` | URI patterns to match in anchor `href` attributes |
| `anchorIgnoredUris` | `string[]` | URI patterns to exclude from anchor matching |
| `anchorLabels` | `string[]` | Text patterns to match in anchor content (case-insensitive) |

**Example configuration:**

```typescript
const options: HtmlDiscoveryOptions = {
  linkMimeTypes: [
    'application/rss+xml',
    'application/atom+xml',
    'application/json',
    'application/feed+json',
  ],
  anchorUris: [
    '/feed',
    '/rss',
    '/rss.xml',
    '/atom.xml',
    '?feed=rss',
  ],
  anchorIgnoredUris: [
    'wp-json/',
    'comments',
    'twitter.com',
  ],
  anchorLabels: [
    'rss',
    'feed',
    'atom',
    'subscribe',
  ],
}
```

---

### `discoverFeedUrisFromHeaders(headers, options)`

Discovers feed URIs from HTTP Link headers (RFC 8288).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `headers` | `Headers` | Yes | Native Headers object from fetch API |
| `options` | `HeadersDiscoveryOptions` | Yes | MIME type filtering configuration |

**Returns:** `string[]` — Array of discovered feed URIs (may be relative)

#### `HeadersDiscoveryOptions`

| Property | Type | Description |
|----------|------|-------------|
| `linkMimeTypes` | `string[]` | MIME types to match in Link header `type` parameters |

**Example configuration:**

```typescript
const options: HeadersDiscoveryOptions = {
  linkMimeTypes: [
    'application/rss+xml',
    'application/atom+xml',
    'application/json',
    'application/feed+json',
  ],
}
```

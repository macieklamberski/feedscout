# Feedscout

[![codecov](https://codecov.io/gh/macieklamberski/feedscout/branch/main/graph/badge.svg)](https://codecov.io/gh/macieklamberski/feedscout)
[![npm version](https://img.shields.io/npm/v/feedscout.svg)](https://www.npmjs.com/package/feedscout)
[![license](https://img.shields.io/npm/l/feedscout.svg)](https://github.com/macieklamberski/feedscout/blob/main/LICENSE)

Lightweight feed autodiscovery for TypeScript. Extract RSS, Atom, and JSON feed URIs from HTML with configurable options.

> **Work in Progress:** This library is under active development. The API may change before reaching v1.0.

## Overview

Feedscout makes it easy to gather all feed URIs from a webpage. It implements multiple discovery strategies:

- **Standard autodiscovery** — `<link rel="alternate">` with feed MIME types
- **HTML5 feeds** — `<link rel="feed">` elements
- **Anchor patterns** — Links matching `/feed`, `/rss.xml`, etc.
- **Anchor text** — Links containing "RSS", "Subscribe", etc.

The library uses [htmlparser2](https://github.com/fb55/htmlparser2) for efficient HTML parsing with low memory footprint (streaming support on the roadmap).

Implementation follows [RSS Board](https://www.rssboard.org/rss-autodiscovery), [WHATWG](https://blog.whatwg.org/feed-autodiscovery), and [historical best practices](https://web.archive.org/web/20100620085023/http://diveintomark.org/archives/2002/08/15/ultraliberal_rss_locator) for feed autodiscovery.

## Installation

```bash
npm install feedscout
```

## Usage

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

const uris = discoverFeedUris(html, {
  linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
  anchorUris: ['/feed', '/rss', '/rss.xml'],
  anchorIgnoredUris: ['wp-json/', 'comments'],
  anchorLabels: ['rss', 'feed', 'subscribe'],
})

console.log(uris) // ['/feed.xml', '/rss']
```

Returned URIs may be relative. Resolve to absolute URLs using new URL(uri, baseUrl).

Identical URIs are deduplicated, but variations like http:// vs https:// are preserved.

## API Reference

### `discoverFeedUris(html, options)`

Discovers feed URIs from HTML content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `html` | `string` | Yes | HTML content to parse |
| `options` | `DiscoverFeedUrisOptions` | Yes | Discovery configuration |

**Returns:** `string[]` — Array of discovered feed URIs (may be relative)

### `DiscoverFeedUrisOptions`

All options are **required**. Configure each discovery strategy explicitly.

| Property | Type | Description |
|----------|------|-------------|
| `linkMimeTypes` | `string[]` | MIME types to match in `<link type="...">` attributes |
| `anchorUris` | `string[]` | URI patterns to match in anchor `href` attributes |
| `anchorIgnoredUris` | `string[]` | URI patterns to exclude from anchor matching |
| `anchorLabels` | `string[]` | Text patterns to match in anchor content (case-insensitive) |

**Example configuration:**

```typescript
const options: DiscoverFeedUrisOptions = {
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

# Feedscout

[![codecov](https://codecov.io/gh/macieklamberski/feedscout/branch/main/graph/badge.svg)](https://codecov.io/gh/macieklamberski/feedscout)
[![npm version](https://img.shields.io/npm/v/feedscout.svg)](https://www.npmjs.com/package/feedscout)
[![license](https://img.shields.io/npm/l/feedscout.svg)](https://github.com/macieklamberski/feedscout/blob/main/LICENSE)

Lightweight feed autodiscovery for TypeScript. Extract RSS, Atom, and JSON feed URIs from HTML with configurable options.

> **Work in Progress:** This library is under active development. The API may change before reaching v1.0.

## Overview

Feedscout makes it easy to gather all feed URIs from webpages using multiple discovery methods.

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

### HTML Discovery

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

### CMS Detection

Detect CMS platforms and discover their conventional feed URI patterns:

```typescript
import { detectCms, discoverFeedUrisFromCmsHtml } from 'feedscout'

const html = '<meta name="generator" content="WordPress 6.4">'

// Detect CMS type from HTML
const cmsType = detectCms(html)
console.log(cmsType) // 'wordpress'

// Get all CMS-specific feed URIs
const uris = discoverFeedUrisFromCmsHtml(html)
console.log(uris)
// ['/feed/', '/feed', '/rss/', '/rss', '/comments/feed/', '/comments/feed',
//  '/category/*/feed/', '/tag/*/feed/', '/wp-json/wp/v2/posts', '/?rest_route=/wp/v2/posts']
```

#### HTTP Header Detection

Detect CMS from HTTP response headers (faster, doesn't require parsing HTML):

```typescript
import { detectCmsFromHeaders } from 'feedscout'

const response = await fetch('https://example.com')

// Detect CMS type from headers
const cmsType = detectCmsFromHeaders(response.headers)
console.log(cmsType) // 'next' | 'nuxt' | 'wordpress' | 'drupal' | undefined
```

**Supported HTTP headers:**
- **Next.js** — `X-Powered-By: Next.js`
- **Nuxt** — `X-Powered-By: Nuxt`
- **WordPress** — `X-Pingback` header (pingback endpoint)
- **Drupal** — `X-Generator: Drupal` (legacy, often removed)

**Note:** HTTP header detection works reliably for Next.js, Nuxt, and WordPress (via X-Pingback). Other CMS platforms don't send identifying headers or remove them for security. Use HTML detection for comprehensive coverage.

**Supported CMS platforms (24):**

- **WordPress** — Detects via meta generator tag, `/wp-content/`, `/wp-includes/`, `/wp-json/` paths
- **Ghost** — Detects via meta generator tag, `/ghost/` path
- **Hexo** — Detects via meta generator tag
- **Jekyll** — Detects via meta generator tag
- **Hugo** — Detects via meta generator tag
- **Gatsby** — Detects via meta generator tag
- **Drupal** — Detects via meta generator tag, `/sites/default/files/` path
- **Joomla** — Detects via meta generator tag, `option=com_` patterns
- **Medium** — Detects via domain patterns
- **Blogger** — Detects via meta generator tag, `.blogspot.com` domain
- **Tumblr** — Detects via domain patterns
- **Wix** — Detects via domain patterns
- **Squarespace** — Detects via domain patterns
- **Webflow** — Detects via meta generator tag, domain patterns
- **Substack** — Detects via domain patterns
- **Bear** — Detects via `bearblog.dev` domain
- **Eleventy** — Detects via meta generator tag
- **Next.js** — Detects via meta generator tag, `__next`, `_next/` patterns
- **Nuxt** — Detects via meta generator tag, `__nuxt`, `_nuxt/` patterns
- **VuePress** — Detects via meta generator tag
- **Docusaurus** — Detects via meta generator tag
- **Nikola** — Detects via meta generator tag, `getnikola.com` domain

## Notes

Returned URIs may be relative. Resolve to absolute URLs using `new URL(uri, baseUrl)`.

Identical URIs are deduplicated, but variations like `http://` vs `https://` are preserved.

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

### `detectCms(html)`

Detects CMS platform from HTML content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `html` | `string` | Yes | HTML content to analyze |

**Returns:** `CmsType \| undefined` — Detected CMS type or `undefined` if no CMS detected

**Supported CMS types:** `'wordpress'`, `'ghost'`, `'hexo'`, `'jekyll'`, `'hugo'`, `'gatsby'`, `'drupal'`, `'joomla'`, `'medium'`, `'blogger'`, `'tumblr'`, `'wix'`, `'squarespace'`, `'webflow'`, `'substack'`, `'bear'`, `'eleventy'`, `'next'`, `'nuxt'`, `'vuepress'`, `'docusaurus'`, `'nikola'`

### `discoverFeedUrisFromCmsHtml(html)`

Discovers all CMS-specific feed URI patterns based on detected platform.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `html` | `string` | Yes | HTML content to analyze |

**Returns:** `string[]` — Array of all CMS-specific feed URIs (may be relative, empty if no CMS detected)

### `detectCmsFromHeaders(headers)`

Detects CMS platform from HTTP response headers.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `headers` | `Headers` | Yes | Native Headers object from fetch API |

**Returns:** `CmsType \| undefined` — Detected CMS type or `undefined` if no identifying headers found

**Detection methods:**
- Checks `X-Powered-By` header for Next.js, Nuxt
- Checks `X-Pingback` header for WordPress
- Checks `X-Generator` header for Drupal (legacy)

**Supported platforms:** `'next'`, `'nuxt'`, `'wordpress'`, `'drupal'`

**Note:** Most CMS platforms don't send identifying headers. For comprehensive detection, use `detectCms()` with HTML content.

### `discoverFeedUrisFromCmsHeaders(headers)`

Discovers CMS-specific feed URI patterns based on platform detected from HTTP headers.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `headers` | `Headers` | Yes | Native Headers object from fetch API |

**Returns:** `string[]` — Array of CMS-specific feed URIs (may be relative, empty if no CMS detected)

### `discoverFeedUrisFromHeaders(headers, options)`

Discovers feed URIs from HTTP Link headers (RFC 8288).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `headers` | `Headers` | Yes | Native Headers object from fetch API |
| `options` | `DiscoverFeedUrisFromHeadersOptions` | Yes | MIME type filtering configuration |

**Returns:** `string[]` — Array of discovered feed URIs (may be relative)

### `DiscoverFeedUrisFromHeadersOptions`

| Property | Type | Description |
|----------|------|-------------|
| `linkMimeTypes` | `string[]` | MIME types to match in Link header `type` parameters |

**Example configuration:**

```typescript
const options: DiscoverFeedUrisFromHeadersOptions = {
  linkMimeTypes: [
    'application/rss+xml',
    'application/atom+xml',
    'application/json',
    'application/feed+json',
  ],
}
```

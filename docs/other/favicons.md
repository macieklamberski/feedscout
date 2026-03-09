---
title: Discover Favicons
---

# Discover Favicons

Feedscout can discover favicon URLs from webpages. Favicons are site icons used in browser tabs, bookmarks, and feed readers.

## Basic Usage

```typescript
import { discoverFavicons } from 'feedscout'

const favicons = await discoverFavicons('https://example.com')
```

By default, all discovery methods are used (html, manifest, headers, guess). You can customize which methods to use:

```typescript
const favicons = await discoverFavicons('https://example.com', {
  methods: ['html', 'guess'],
})
```

Results include the favicon URL and metadata:

```typescript
{
  url: 'https://example.com/apple-touch-icon.png',
  method: 'html',
  rel: 'apple-touch-icon',
  sizes: '180x180',
}
```

## Discovery Methods

| Method | Source | Description |
|--------|--------|-------------|
| `html` | HTML `<link>` and `<meta>` tags | Parses icon-related link elements and `msapplication-TileImage` meta tags |
| `manifest` | Web App Manifest | Fetches `manifest.json`/`.webmanifest` and extracts `icons[]` array |
| `headers` | HTTP `Link` headers | Parses `rel="icon"` links from response headers |
| `guess` | Known paths | Tries common favicon paths like `/favicon.ico`, `/apple-touch-icon.png` |
| `api` | Third-party APIs | Generates URLs from Google S2 and DuckDuckGo favicon APIs |

### HTML Method

Parses `<link>` elements with icon-related `rel` values:

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

Also extracts `<meta>` tags:

```html
<meta name="msapplication-TileImage" content="/mstile-144x144.png">
```

Supported `rel` values: `icon`, `shortcut icon`, `apple-touch-icon`, `apple-touch-icon-precomposed`.

### Manifest Method

Discovers `<link rel="manifest">` in HTML, fetches the manifest file, and extracts icons:

```json
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Icon `src` URLs are resolved relative to the manifest URL.

### Headers Method

Parses HTTP `Link` headers for icon-related relations:

```http
Link: </favicon.png>; rel="icon"; type="image/png"; sizes="32x32"
```

### Guess Method

Tests common favicon paths against the site's origin:

- `/favicon.ico`
- `/apple-touch-icon.png`
- `/apple-touch-icon-precomposed.png`
- `/favicon.png`
- `/favicon.svg`

### API Method

Generates URLs from third-party favicon APIs (not enabled by default):

```typescript
const favicons = await discoverFavicons('https://example.com', {
  methods: ['html', 'guess', 'api'],
})
```

Built-in providers: Google S2 and DuckDuckGo. Custom providers can be added:

```typescript
import { googleS2, duckDuckGo } from 'feedscout/favicons'

const favicons = await discoverFavicons('https://example.com', {
  methods: ['html', 'api'],
  api: {
    providers: [googleS2(128), duckDuckGo()],
  },
})
```

## Using Existing Content

If you already have the HTML content and headers, pass them directly:

```typescript
const response = await fetch('https://example.com')
const content = await response.text()

const favicons = await discoverFavicons(
  {
    url: 'https://example.com',
    content,
    headers: response.headers,
  },
  {
    methods: ['html', 'headers'],
  },
)
```

## Custom Fetch Function

Use a custom HTTP client. See [Customize Data Fetching](/customization/data-fetching) for examples with Axios, Got, Ky, and more.

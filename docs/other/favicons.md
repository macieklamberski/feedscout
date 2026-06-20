---
title: Discover Favicons
---

# Discover Favicons

Feedscout can discover favicon URLs from webpages and feeds. Favicons are site icons used in browser tabs, bookmarks, and feed readers.

## Basic Usage

```typescript
import { discoverFavicons } from 'feedscout'

const favicons = await discoverFavicons('https://example.com')
```

Each result contains the favicon URL and validation status:

```typescript
{
  url: 'https://example.com/apple-touch-icon.png',
  isValid: true,
  method: 'html',
}
```

By default, all discovery methods are used (platform, feed, html, headers, guess). You can customize which methods to use:

```typescript
const favicons = await discoverFavicons('https://example.com', {
  methods: ['html', 'headers', 'guess'],
})
```

::: warning Untrusted SVG favicons
A favicon validated as an SVG is returned by URL only — its contents are not sanitized. SVG files can carry active content (e.g. `<svg onload="...">`), so treat returned SVG favicon URLs as untrusted: render them as `<img src>` (which neutralizes scripts) rather than inlining the markup, or sanitize before use.
:::

## Discovery Methods

Favicons use the same discovery pipeline as feeds — see the [Feeds](/feeds) section for details on how each method works.

| Method | What It Looks For |
|--------|-------------------|
| Platform | Avatars/icons from known platforms (GitHub, Mastodon, Bluesky, etc.) |
| Feed | `<icon>` in Atom feeds, `favicon`/`icon` in JSON Feeds |
| HTML | `<link>` tags with `rel="icon"`, `rel="shortcut"`, `rel="apple-touch-icon"` |
| Headers | `Link` headers with icon-related `rel` values |
| Guess | Common paths like `/favicon.ico`, `/apple-touch-icon.png` |

## Supported Platforms

The Platform method extracts avatars and icons directly from known platforms using their public APIs or URL conventions:

| Platform | What It Extracts | Method |
|----------|-----------------|--------|
| GitHub | User avatar | URL pattern |
| GitHub Gist | User avatar | URL pattern |
| GitLab | User or group avatar | Public API |
| Mastodon | Profile avatar | Public API |
| Bluesky | Profile avatar | Public API |
| Reddit | Subreddit icon or user avatar | Public API |
| Tumblr | Blog avatar | URL pattern |
| Codeberg | User avatar | URL pattern |
| Lobsters | User avatar | URL pattern |
| SourceForge | Project icon | URL pattern |
| DeviantArt | User avatar | URL pattern |
| Dev.to | Profile image | Public API |

## Extracting Icons from Feeds

When given a feed URL, favicon discovery can extract icons directly from the feed content. Atom feeds provide an `<icon>` element, and JSON Feeds include `favicon` and `icon` fields:

```typescript
// Pass a feed URL to extract its icon
const favicons = await discoverFavicons('https://example.com/feed.xml')

// Or provide existing feed content
const favicons = await discoverFavicons({
  url: 'https://example.com/feed.json',
  content: feedContent,
})
```

## Configuration

Customize discovery the same way as feeds:

```typescript
const favicons = await discoverFavicons(url, {
  methods: {
    html: true,
    guess: {
      uris: ['/favicon.ico', '/icon.svg'],
    },
  },
})
```

## Default Guess Paths

```typescript
import { defaultGuessPaths } from 'feedscout/favicons'

// [
//   '/favicon.ico',
//   '/apple-touch-icon.png',
//   '/apple-touch-icon-precomposed.png',
//   '/favicon.png',
//   '/favicon.svg',
// ]
```

## Default Link Selectors

Favicon discovery looks for these `rel` values in HTML `<link>` tags and HTTP `Link` headers:

```typescript
import { defaultIconRels, linkSelectors } from 'feedscout/favicons'

// ['icon', 'shortcut', 'apple-touch-icon', 'apple-touch-icon-precomposed']
```

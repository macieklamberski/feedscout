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

Each result contains the favicon URL and validation status. A URL is valid when the response is 2xx and is an image, by its `Content-Type` or by its content:

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
A favicon validated as an SVG is returned by URL only. Its contents are not sanitized. SVG files can carry active content (e.g. `<svg onload="...">`), so treat returned SVG favicon URLs as untrusted: render them as `<img src>` (which neutralizes scripts), not as inlined markup, or sanitize before use.
:::

## Discovery Methods

Favicons use the same discovery pipeline as feeds. See the [Feeds](/feeds) section for details on how each method works.

| Method | What It Looks For |
|--------|-------------------|
| Platform | Avatars/icons from known platforms (GitHub, Mastodon, Bluesky, etc.) |
| Feed | `<icon>` in Atom feeds, `itunes:image` podcast artwork in RSS and Atom feeds, `favicon`/`icon` in JSON Feeds |
| HTML | `<link>` tags with `rel="icon"`, `rel="shortcut"`, `rel="alternate icon"`, `rel="apple-touch-icon"` |
| Headers | `Link` headers with icon-related `rel` values |
| Guess | Common paths like `/favicon.ico`, `/apple-touch-icon.png` |

## Supported Platforms

The Platform method extracts avatars and icons directly from known platforms using their public APIs or URL conventions:

| Platform | What It Extracts | Method |
|----------|-----------------|--------|
| GitHub | User avatar | URL pattern |
| GitHub Gist | User avatar | URL pattern |
| GitLab | User or group avatar | Public API, through an [enricher](#enriching-platform-icons) |
| Mastodon | Profile avatar | Public API, through an [enricher](#enriching-platform-icons) |
| Bluesky | Profile avatar | Public API, through an [enricher](#enriching-platform-icons) |
| Reddit | Subreddit icon or user avatar | Public API, through an [enricher](#enriching-platform-icons) |
| Tumblr | Blog avatar | URL pattern |
| Gitea (Codeberg, gitea.com, self-hosted) | User avatar | URL pattern |
| Lobsters | User avatar | URL pattern |
| SourceForge | Project icon | URL pattern |
| DeviantArt | User avatar | URL pattern |
| Dev.to | Profile image | Public API, through an [enricher](#enriching-platform-icons) |
| Steam | Game icon | Page HTML |
| Letterboxd | Member avatar from member subpages, such as films and lists | Page HTML |
| Micro.blog | User avatar | URL pattern |
| BitChute | Channel image | Page HTML |
| YouTube | Channel avatar | Page HTML |
| Behance | Profile avatar | Page HTML |
| Zenn | Profile, publication or topic icon | Page HTML |
| Pinterest | Profile avatar | Page HTML, or the profile page through an [enricher](#enriching-platform-icons) for saved pages |
| Nebula | Channel avatar | Page HTML, or the content API through an [enricher](#enriching-platform-icons) |
| Naver Blog | Blog profile picture | Page HTML, and the mobile page through an [enricher](#enriching-platform-icons) for desktop blog pages |

## Enriching Platform Icons

A platform handler reads only the page URL and the page content. On some platforms the icon takes an extra request to reach, such as a call to the platform's API. For those pages the handler returns a [`DiscoverRef`](/reference/types#discoverref) naming the platform and the account, and discovery hands every ref to `enrichFn`.

By default, `enrichFn` runs the built-in enrichers in `defaultFaviconEnrichers`, making their requests through discovery's `fetchFn`. Set `enrichFn: false` to make no extra request, in which case refs are dropped:

```typescript
const favicons = await discoverFavicons(url, {
  enrichFn: false,
})
```

To pick the enrichers, build the function with `createEnrichFaviconFn` and the enrichers you want. Each built-in enricher is exported on its own, such as `mastodonEnricher`. A function you build this way makes its requests through the `fetchFn` you pass it, not discovery's, so pass the same one to both:

```typescript
import { createEnrichFaviconFn, mastodonEnricher } from 'feedscout/favicons'

const favicons = await discoverFavicons(url, {
  fetchFn: myCustomFetch,
  enrichFn: createEnrichFaviconFn({ enrichers: [mastodonEnricher], fetchFn: myCustomFetch }),
})
```

The addresses it returns are validated like any other platform candidate. You can pass your own function too, for example one that answers from a cache:

```typescript
const favicons = await discoverFavicons(url, {
  enrichFn: (refs) => {
    return refs.map((ref) => cache.get(`${ref.platform}:${ref.id}`))
  },
})
```

## Extracting Icons from Feeds

When given a feed URL, favicon discovery can extract icons directly from the feed content. Atom feeds provide an `<icon>` element, podcast feeds in RSS or Atom provide their square `itunes:image` artwork, and JSON Feeds include `favicon` and `icon` fields. The RSS `<image>` element is not used, since it is a channel logo that is usually wide:

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

// ['icon', 'shortcut', 'alternate icon', 'apple-touch-icon', 'apple-touch-icon-precomposed']
```

---
title: Migrating from 1.x to 2.x
---

# Migrating from 1.x to 2.x

This guide covers all breaking changes when upgrading from Feedscout 1.x to 2.x. Each breaking change is detailed with specific upgrade steps and examples.

> [!IMPORTANT]
> Version 2.x is ESM-only, and Feedsmith 3 is now a peer dependency. If your project uses Feedsmith 2 directly, upgrade it to 3.x.

## Installation

Update your package to the latest 2.x version:

```bash
npm install feedscout@latest
```

## Migration Checklist

Use this checklist to ensure a complete migration:

- Upgrade Feedsmith to 3.x if your project uses it directly
- Replace `require('feedscout')` with `import` statements
- Replace `feedscout/utils` imports with imports from `trousse`
- Handle `undefined` from `omitEmpty` if you use it
- Update custom `extractUrls` callbacks to Feedsmith 3 feed shapes
- Update code that matches on hint keys: `codeberg:*` is now `gitea:*`, `artstation:artwork-trending` is now `artstation:artwork-latest`, and `producthunt:topic` and `producthunt:category` are gone
- Set `maxAncestorDepth: 0` and `sectionNames: []` on the Guess method if you need the 1.x set of guessed URLs

## Breaking Changes

### ESM-Only Package

Feedscout 2.x ships only ES modules. The CommonJS build and the `require` conditions in the `exports` map have been removed.

#### Before (1.x)
```typescript
const { discoverFeeds } = require('feedscout')

const feeds = await discoverFeeds('https://example.com')
```

#### After (2.x)
```typescript
import { discoverFeeds } from 'feedscout'

const feeds = await discoverFeeds('https://example.com')
```

#### Migration Steps
1. Replace `require()` calls with `import` statements
2. In a CommonJS project that cannot switch to ESM, load Feedscout with `await import('feedscout')`, or use a Node.js version that supports `require()` of ES modules (20.19 or 22.12 and later)

### Feedsmith Is Now a Peer Dependency

Feedscout 1.x installed Feedsmith 2 as a regular dependency. Feedscout 2.x lists Feedsmith as a peer dependency at `^3.0.0`, so Feedscout and your code share one copy. npm, pnpm and Bun install it for you. You only need to act if your project uses Feedsmith 2 directly, because that version no longer satisfies the peer range.

#### Migration Steps
1. If your own code uses Feedsmith 2, upgrade it to 3.x by following the [Feedsmith 2.x to 3.x migration guide](https://feedsmith.dev/migration/v2-to-v3)

### Feed Method Callbacks Receive Feedsmith 3 Feeds

The Feed method passes the result of Feedsmith's `parseFeed` to `extractUrls`, and `getFeedSiteUrl` accepts the same value. Both now use Feedsmith 3 types. The most visible change is in Atom feeds: text fields such as `title` and `subtitle` are objects with a `value` property instead of plain strings.

#### Before (1.x)
```typescript
import { discoverFavicons } from 'feedscout'

const favicons = await discoverFavicons('https://example.com/feed.xml', {
  methods: {
    feed: {
      extractUrls: ({ format, feed }) => {
        if (format === 'atom') {
          console.log(feed.title) // string
          return [feed.icon, feed.logo].filter((url) => url !== undefined)
        }

        return []
      },
    },
  },
})
```

#### After (2.x)
```typescript
import { discoverFavicons } from 'feedscout'

const favicons = await discoverFavicons('https://example.com/feed.xml', {
  methods: {
    feed: {
      extractUrls: ({ format, feed }) => {
        if (format === 'atom') {
          console.log(feed.title?.value) // string
          return [feed.icon, feed.logo].filter((url) => url !== undefined)
        }

        // Returning undefined is now allowed when nothing is found.
        return undefined
      },
    },
  },
})
```

#### Migration Steps
1. Review custom `extractUrls` callbacks against the Feedsmith 3 feed types
2. Read `.value` from Atom text fields such as `title`, `subtitle` and `rights`
3. Pass Feedsmith 3 `parseFeed` results to `getFeedSiteUrl`

### Utils Subpath Removed

The `feedscout/utils` entry point has been removed. The same helpers are available in the [trousse](https://www.npmjs.com/package/trousse) package, which also exports the `Pattern` type. Install it if you used these helpers:

```bash
npm install trousse
```

| Before (1.x) | After (2.x) |
|---|---|
| `import { anyWordMatchesAnyOf } from 'feedscout/utils'` | `import { anyWordMatchesAnyOf } from 'trousse'` |
| `import { endsWithAnyOf } from 'feedscout/utils'` | `import { endsWithAnyOf } from 'trousse'` |
| `import { includesAnyOf } from 'feedscout/utils'` | `import { includesAnyOf } from 'trousse'` |
| `import { isAnyOf } from 'feedscout/utils'` | `import { isAnyOf } from 'trousse'` |
| `import { isHostOf } from 'feedscout/utils'` | `import { isHostOf } from 'trousse'` |
| `import { isSubdomainOf } from 'feedscout/utils'` | `import { isSubdomainOf } from 'trousse'` |
| `import { omitEmpty } from 'feedscout/utils'` | `import { omitEmpty } from 'trousse'` |
| `import type { Pattern } from 'feedscout/utils'` | `import type { Pattern } from 'trousse'` |

The helpers keep their names and arguments. The trousse versions also accept readonly arrays, and `isHostOf` and `isSubdomainOf` accept a `URL` object. One return value differs: `omitEmpty` returns `undefined` instead of an empty array when nothing is left.

#### Before (1.x)
```typescript
import { isHostOf, omitEmpty } from 'feedscout/utils'

isHostOf('https://www.youtube.com/@channel', ['youtube.com', 'www.youtube.com']) // true

const urls = omitEmpty([undefined, ''])
urls.length // 0
```

#### After (2.x)
```typescript
import { isHostOf, omitEmpty } from 'trousse'

isHostOf('https://www.youtube.com/@channel', ['youtube.com', 'www.youtube.com']) // true

const urls = omitEmpty([undefined, '']) ?? []
urls.length // 0
```

#### Migration Steps
1. Install `trousse`
2. Change imports from `feedscout/utils` to `trousse`
3. Add `?? []` where your code expects `omitEmpty` to return an array

### Platform Hint Keys Changed

Some platform handlers changed the hint keys they attach to discovered URLs. This matters if your code matches on `hint.key`.

| Before (1.x) | After (2.x) |
|---|---|
| `codeberg:activity` | `gitea:activity` |
| `codeberg:releases` | `gitea:releases` |
| `codeberg:tags` | `gitea:tags` |
| `codeberg:branch-commits` | `gitea:branch-commits` |
| `codeberg:file-history` | `gitea:file-history` |
| `artstation:artwork-trending` | `artstation:artwork-latest` |
| `producthunt:topic` | Removed |
| `producthunt:category` | Removed |

The Codeberg handler is now `giteaHandler`. It still covers codeberg.org and gitea.com, and also matches self-hosted Gitea instances. The ArtStation trending feed was a duplicate, so the handler now returns the latest artwork feed. Product Hunt topic and category pages now return only the main `https://www.producthunt.com/feed`, because the feed ignores the topic and category parameters.

#### Before (1.x)
```typescript
import { discoverFeeds } from 'feedscout'

const feeds = await discoverFeeds('https://codeberg.org/forgejo/forgejo')
const releases = feeds.find((feed) => feed.hint?.key === 'codeberg:releases')
```

#### After (2.x)
```typescript
import { discoverFeeds } from 'feedscout'

const feeds = await discoverFeeds('https://codeberg.org/forgejo/forgejo')
const releases = feeds.find((feed) => feed.hint?.key === 'gitea:releases')
```

#### Migration Steps
1. Replace `codeberg:` hint key prefixes with `gitea:`
2. Replace `artstation:artwork-trending` with `artstation:artwork-latest`
3. Remove handling for `producthunt:topic` and `producthunt:category`

### Guess Method Tests More URLs by Default

In `discoverFeeds`, the Guess method now also tests feed paths under the directories of the page URL and under section links found in the page HTML, such as `/blog`. The defaults are `maxAncestorDepth: 2` and the exported `sectionNames` list. Discovery can find more feeds and makes more requests. The `maxUris` limit still applies.

#### Before (1.x)
```typescript
import { discoverFeeds } from 'feedscout'

// Tests only root-level paths such as https://example.com/feed.xml
const feeds = await discoverFeeds('https://example.com/blog/post-slug/')
```

#### After (2.x)
```typescript
import { discoverFeeds } from 'feedscout'

// Also tests https://example.com/blog/feed.xml and section links from the page
const feeds = await discoverFeeds('https://example.com/blog/post-slug/')

// Keep the 1.x behavior
const rootOnlyFeeds = await discoverFeeds('https://example.com/blog/post-slug/', {
  methods: {
    guess: {
      maxAncestorDepth: 0,
      sectionNames: [],
    },
  },
})
```

#### Migration Steps
1. Check whether the extra requests fit your rate limits and timeouts
2. Set `maxAncestorDepth: 0` and `sectionNames: []` to keep the 1.x set of guessed URLs

## New Features

### Platform Subpath

The `feedscout/platform` entry point is now published. It exports `discoverUrisFromPlatform`, `defaultPlatformOptions`, the `PlatformHandler` and `PlatformMethodOptions` types, and every platform handler:

```typescript
import { discoverFeeds } from 'feedscout'
import { githubHandler, youtubeHandler } from 'feedscout/platform'

const feeds = await discoverFeeds('https://www.youtube.com/@channel', {
  methods: {
    platform: {
      handlers: [youtubeHandler, githubHandler],
    },
  },
})
```

See [Platform](/feeds/platform) for the full list of handlers.

### More Platform Handlers

Feed discovery now includes handlers for more platforms, among them Bitchute, Confluence, Drupal, Flickr, Jira, PeerTube, Shopify, SourceHut, Squarespace and XenForo.

### Ancestor Paths and Section Links in Guess Method

The Guess method accepts `maxAncestorDepth` and `sectionNames` options. The default section names are exported as `sectionNames` from `feedscout/feeds`, and `extractSectionBaseUrls` is exported from `feedscout/methods`. See [Guess](/feeds/guess) for details.

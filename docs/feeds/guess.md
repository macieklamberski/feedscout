---
title: "Discover Feeds: Guess Method"
---

# Guess Method

The Guess method tests common feed paths against the base URL as a fallback when other methods don't find feeds.

## How It Works

Many websites place feeds at predictable paths. The Guess method tests these paths:

```
/feed
/rss
/atom.xml
/feed.xml
/rss.xml
/index.xml
```

Each path is appended to the base URL and checked for a valid feed.

## Ancestor Paths

Some sites serve their feed from a section directory rather than the root — for example, a post at `/blog/post-slug/` with the feed at `/blog/feed.xml`. In addition to the root-level paths, the Guess method tests path-style URIs against the directory ancestors of the base URL:

```
https://example.com/blog/post-slug/
→ https://example.com/feed.xml          (root)
→ https://example.com/blog/feed.xml     (ancestor)
→ https://example.com/blog/post-slug/feed.xml
```

The `maxAncestorDepth` option controls how many directory levels from the root are tested (default: `2` for feeds). Set it to `0` to only test root-level paths:

```typescript
const feeds = await discoverFeeds(url, {
  methods: {
    guess: {
      maxAncestorDepth: 0,
    },
  },
})
```

Every configured URI is tested against each ancestor directory the same way it is tested against the root: `/feed.xml` resolves under the directory, and a bare query URI like `?feed=rss` is appended to it (`https://example.com/blog/?feed=rss`).

## URI Sets

There are three predefined URI sets:

### Minimal

Basic paths that cover most modern sites:

```typescript
import { urisMinimal } from 'feedscout/feeds'

// [
//   '/feed',
//   '/rss',
//   '/atom.xml',
//   '/feed.xml',
//   '/rss.xml',
//   '/index.xml',
// ]
```

### Balanced (Default)

Includes JSON Feed and common variations:

```typescript
import { urisBalanced } from 'feedscout/feeds'

// urisMinimal + [
//   '/feed/',
//   '/index.atom',
//   '/index.rss',
//   '/feed.json',
// ]
```

### Comprehensive

Includes WordPress, Blogger, and many other patterns:

```typescript
import { urisComprehensive } from 'feedscout/feeds'

// urisBalanced + [
//   '/atom',
//   '/rss2.xml',
//   '?format=rss',
//   '?rss=1',
//   '/feeds/posts/default',
//   ...
// ]
```

Query URIs behave differently from path URIs: a bare `?format=rss` is appended to the current page's path (`https://example.com/blog?format=rss`), while `/`-prefixed paths always resolve from the site root. This matches platforms like WordPress and Squarespace that serve feeds via a query parameter on the page you're on.

## Configuration

Feedscout comes with reasonable defaults, but you can customize which paths are tested if needed.

### Custom URIs

Specify which paths to test:

```typescript
const feeds = await discoverFeeds(url, {
  methods: {
    guess: {
      uris: ['/feed', '/rss.xml', '/custom-feed'],
    },
  },
})
```

### Additional Base URLs

Test paths on additional domains (e.g., subdomains):

```typescript
import { getWwwCounterpart, getSubdomainVariants } from 'feedscout/methods'

const feeds = await discoverFeeds('https://example.com', {
  methods: {
    guess: {
      uris: ['/feed', '/rss.xml'],
      additionalBaseUrls: [
        getWwwCounterpart('https://example.com'),
        ...getSubdomainVariants('https://example.com', ['blog', 'feeds']),
      ],
    },
  },
})
```

This will test:
- `https://example.com/feed`
- `https://www.example.com/feed`
- `https://blog.example.com/feed`
- `https://feeds.example.com/feed`
- (and the same for `/rss.xml`)

## Utility Functions

### getWwwCounterpart

Returns the www or non-www variant of a URL:

```typescript
import { getWwwCounterpart } from 'feedscout/methods'

getWwwCounterpart('https://example.com')
// 'https://www.example.com'

getWwwCounterpart('https://www.example.com')
// 'https://example.com'
```

### getSubdomainVariants

Generates subdomain variants of a URL:

```typescript
import { getSubdomainVariants } from 'feedscout/methods'

getSubdomainVariants('https://example.com', ['blog', 'feeds'])
// [
//   'https://blog.example.com',
//   'https://feeds.example.com',
// ]
```

### generateUrlCombinations

Combines base URLs with URI paths:

```typescript
import { generateUrlCombinations } from 'feedscout/methods'

generateUrlCombinations(['https://example.com'], ['/feed', '/rss'])
// [
//   'https://example.com/feed',
//   'https://example.com/rss',
// ]
```

## Using Directly

You can use the Guess discovery function directly:

```typescript
import { discoverUrisFromGuess } from 'feedscout/methods'

const uris = discoverUrisFromGuess({
  baseUrl: 'https://example.com',
  uris: ['/feed', '/rss.xml'],
})

// [
//   'https://example.com/feed',
//   'https://example.com/rss.xml',
// ]
```

> [!NOTE]
> Unlike `discoverUrisFromHtml` and `discoverUrisFromHeaders`, the Guess method returns URLs without checking if they exist. Validation happens during the main discovery process.

## When to Use

The Guess method should typically be used as a fallback:

```typescript
const feeds = await discoverFeeds(url, {
  methods: ['html', 'headers', 'guess'],
})
```

Since it generates many URLs to test, it's slower than HTML and Headers methods. Use it when:

- HTML and Headers methods don't find any feeds.
- You suspect a feed exists but isn't properly advertised.
- You're scanning a site that doesn't follow autodiscovery standards.

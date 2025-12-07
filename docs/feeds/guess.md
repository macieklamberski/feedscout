---
outline: 2
prev: Headers Method
next: Discover More
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

## URI Sets

There are three predefined URI sets:

### Minimal

Basic paths that cover most modern sites:

```typescript
import { feedUrisMinimal } from 'feedscout/feeds'

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
import { feedUrisBalanced } from 'feedscout/feeds'

// feedUrisMinimal + [
//   '/feed/',
//   '/index.atom',
//   '/index.rss',
//   '/feed.json',
// ]
```

### Comprehensive

Includes WordPress, Blogger, and many other patterns:

```typescript
import { feedUrisComprehensive } from 'feedscout/feeds'

// feedUrisBalanced + [
//   '/?feed=rss',
//   '/?feed=atom',
//   '/feeds/posts/default',
//   ...
// ]
```

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

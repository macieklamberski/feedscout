---
outline: 2
prev: Guess Method
next: Discover WebSub Hubs
---

# Discover Blogrolls

Feedscout can discover OPML blogrolls alongside regular feeds. Blogrolls are collections of feed subscriptions that websites share with visitors.

## What Are Blogrolls?

Blogrolls are [OPML](https://opml.org/) files containing lists of feeds. They're used to share reading lists, recommendations, or subscriptions. Common locations include:

```
/.well-known/recommendations.opml
/blogroll.opml
/opml.xml
/subscriptions.opml
```

## Discovering Blogrolls

Use `discoverBlogrolls()` to find OPML files:

```typescript
import { discoverBlogrolls } from 'feedscout'

const blogrolls = await discoverBlogrolls('https://example.com', {
  methods: ['html', 'headers', 'guess'],
})
```

Results include the blogroll URL and title:

```typescript
{
  url: 'https://example.com/blogroll.opml',
  isValid: true,
  title: 'My Reading List',
}
```

## Discovery Methods

Blogrolls use the same three discovery methods as feeds — see the [Feeds](/feeds/) section for details on how each method works.

| Method | What It Looks For |
|--------|-------------------|
| HTML | `<link rel="blogroll">` and anchor tags matching OPML patterns |
| Headers | `Link: </blogroll.opml>; rel="blogroll"` headers |
| Guess | Common paths like `/.well-known/recommendations.opml`, `/blogroll.opml` |

## Configuration

Customize discovery the same way as feeds:

```typescript
import { urisComprehensive } from 'feedscout/blogrolls'

const blogrolls = await discoverBlogrolls(url, {
  methods: {
    html: {
      anchorLabels: ['blogroll', 'opml', 'subscriptions'],
    },
    guess: {
      uris: urisComprehensive,
    },
  },
})
```

## URI Sets

There are three predefined URI sets:

### Minimal

Basic paths following common conventions:

```typescript
import { urisMinimal } from 'feedscout/blogrolls'

// [
//   '/.well-known/recommendations.opml',
//   '/blogroll.opml',
//   '/opml.xml',
// ]
```

### Balanced (Default)

Includes additional common variations:

```typescript
import { urisBalanced } from 'feedscout/blogrolls'

// urisMinimal + [
//   '/blogroll.xml',
//   '/subscriptions.opml',
//   '/recommendations.opml',
// ]
```

### Comprehensive

Includes less common patterns:

```typescript
import { urisComprehensive } from 'feedscout/blogrolls'

// urisBalanced + [
//   '/links.opml',
//   '/feeds.opml',
//   '/subscriptions.xml',
// ]
```

## Default Link Selectors

Blogroll discovery uses these link selectors:

```typescript
import { linkSelectors, mimeTypes } from 'feedscout/blogrolls'

// [
//   { rel: 'blogroll' },
//   { rel: 'outline', types: mimeTypes },
// ]
```

---
title: "Reference: API Overview"
---

# API Reference

This section documents all public functions and types exported by Feedscout.

## Main Functions

| Function | Description | Import |
|----------|-------------|--------|
| [`discoverFeeds`](/reference/discover-feeds) | Discover and validate feeds from a URL | `feedscout` |
| [`discoverBlogrolls`](/reference/discover-blogrolls) | Discover and validate OPML blogrolls | `feedscout` |
| [`discoverHubs`](/reference/discover-hubs) | Discover WebSub hubs from feeds | `feedscout` |

## Discovery Method Functions

These functions extract URIs without validation. Import from `feedscout/methods`:

| Function | Description |
|----------|-------------|
| `discoverUrisFromHtml` | Extract feed URIs from HTML content |
| `discoverUrisFromHeaders` | Extract feed URIs from HTTP headers |
| `discoverUrisFromGuess` | Generate feed URIs from common paths |

## Utility Functions

Import from `feedscout/methods`:

| Function | Description |
|----------|-------------|
| `getWwwCounterpart` | Get www/non-www variant of a URL |
| `getSubdomainVariants` | Generate subdomain variants of a URL |
| `generateUrlCombinations` | Combine base URLs with URI paths |

Import from `feedscout/utils`:

| Function | Description |
|----------|-------------|
| `isSubdomainOf` | Check if URL is subdomain of domain |
| `isHostOf` | Check if URL host matches any in list |
| `includesAnyOf` | Check if string includes any pattern |
| `isAnyOf` | Check if string equals any pattern |
| `anyWordMatchesAnyOf` | Check if any word matches patterns |
| `endsWithAnyOf` | Check if string ends with any pattern |

## Export Paths

Feedscout uses multiple export paths for tree-shaking:

```typescript
// Main exports
import { discoverFeeds, discoverBlogrolls, discoverHubs } from 'feedscout'

// Feed-specific defaults and types
import { mimeTypes, urisBalanced } from 'feedscout/feeds'

// Blogroll-specific defaults and types
import { urisBalanced } from 'feedscout/blogrolls'

// Hub-specific types
import type { HubResult, DiscoverHubsOptions } from 'feedscout/hubs'

// Discovery method functions
import { discoverUrisFromHtml } from 'feedscout/methods'

// Utility functions
import { isSubdomainOf, isHostOf } from 'feedscout/utils'
```

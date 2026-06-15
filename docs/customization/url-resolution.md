---
title: "Customization: URL Resolution"
---

# Customize URL Resolution

Feedscout resolves discovered URLs before validation to ensure consistent results. You can provide a custom resolution function to change this behavior.

## Default Behavior

By default, Feedscout resolves relative URLs against the base URL:

```typescript
// Base URL: https://example.com/blog/
// Discovered: /feed.xml
// Resolved: https://example.com/feed.xml

// Base URL: https://example.com/blog/
// Discovered: ../rss
// Resolved: https://example.com/rss
```

## Custom Resolution

Provide a `resolveUrlFn` to customize URL resolution:

```typescript
import type { DiscoverResolveUrlFn } from 'feedscout'

const customResolve: DiscoverResolveUrlFn = (url, baseUrl) => {
  // Resolve relative URLs
  const resolved = new URL(url, baseUrl).href

  // Remove tracking parameters
  const parsed = new URL(resolved)
  parsed.searchParams.delete('utm_source')
  parsed.searchParams.delete('utm_medium')
  parsed.searchParams.delete('utm_campaign')

  return parsed.href
}

const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  resolveUrlFn: customResolve,
})

// Also works with discoverHubs
const hubs = await discoverHubs(url, {
  resolveUrlFn: customResolve,
})
```

## Interface

```typescript
type DiscoverResolveUrlFn = (url: string, baseUrl: string | undefined) => string
```

## Use Cases

### Removing Query Parameters

Strip unnecessary query parameters:

```typescript
const resolveUrl: DiscoverResolveUrlFn = (url, baseUrl) => {
  const resolved = new URL(url, baseUrl)

  // Keep only essential parameters
  const essentialParams = ['format', 'type']
  const params = new URLSearchParams()

  for (const key of essentialParams) {
    const value = resolved.searchParams.get(key)
    if (value) params.set(key, value)
  }

  resolved.search = params.toString()
  return resolved.href
}
```

### Forcing HTTPS

Upgrade HTTP URLs to HTTPS:

```typescript
const resolveUrl: DiscoverResolveUrlFn = (url, baseUrl) => {
  const resolved = new URL(url, baseUrl)
  resolved.protocol = 'https:'
  return resolved.href
}
```

### Removing Trailing Slashes

Remove trailing slashes from paths:

```typescript
const resolveUrl: DiscoverResolveUrlFn = (url, baseUrl) => {
  const resolved = new URL(url, baseUrl)
  resolved.pathname = resolved.pathname.replace(/\/+$/, '')
  return resolved.href
}
```

### Custom Domain Handling

Rewrite URLs for specific domains:

```typescript
const resolveUrl: DiscoverResolveUrlFn = (url, baseUrl) => {
  const resolved = new URL(url, baseUrl)

  // Use feeds subdomain for specific sites
  if (resolved.hostname === 'example.com') {
    resolved.hostname = 'feeds.example.com'
  }

  return resolved.href
}
```

## Cleaning Discovered URLs

`resolveUrlFn` turns a discovered URL into an absolute one. To additionally **clean** discovered URLs — unwrap redirect/affiliate/share wrappers (`?url=…`, `?feed=aHR0c…`) into the real feed, or strip tracking parameters — provide a `cleanUrlFn`. It runs after resolution and before deduplication, so cleaned URLs also dedupe correctly.

```typescript
import type { DiscoverCleanUrlFn } from 'feedscout'

const cleanUrlFn: DiscoverCleanUrlFn = (url) => {
  const parsed = new URL(url)
  parsed.searchParams.delete('utm_source')
  parsed.searchParams.delete('utm_medium')
  return parsed.href
}

const feeds = await discoverFeeds(url, { cleanUrlFn })
```

Feedscout does not bundle a cleaner. [`urlpurify`](https://github.com/macieklamberski/urlpurify) (zero dependencies) is a drop-in that unwraps 70+ wrapper services and strips known tracking parameters:

```typescript
import { cleanUrl } from 'urlpurify'

const feeds = await discoverFeeds(url, { cleanUrlFn: cleanUrl })
```

## Interface (cleanUrlFn)

```typescript
type DiscoverCleanUrlFn = (url: string) => string
```

## Combining with Other Options

URL resolution works with `discoverFeeds`, `discoverBlogrolls`, and `discoverHubs`:

```typescript
const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  resolveUrlFn: customResolve,
  extractFn: customExtractor,
  concurrency: 3,
})

const hubs = await discoverHubs(url, {
  methods: ['headers', 'html'],
  resolveUrlFn: customResolve,
})
```

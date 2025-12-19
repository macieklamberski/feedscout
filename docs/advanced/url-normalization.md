---
prev: Custom Extractors
next: API Reference
---

# URL Normalization

Feedscout normalizes discovered URLs before validation to ensure consistent results. You can provide a custom normalization function to change this behavior.

## Default Behavior

By default, Feedscout resolves relative URLs against the base URL:

```typescript
// Base URL: https://example.com/blog/
// Discovered: /feed.xml
// Normalized: https://example.com/feed.xml

// Base URL: https://example.com/blog/
// Discovered: ../rss
// Normalized: https://example.com/rss
```

## Custom Normalization

Provide a `normalizeUrlFn` to customize URL normalization:

```typescript
import type { DiscoverNormalizeUrlFn } from 'feedscout'

const customNormalize: DiscoverNormalizeUrlFn = (url, baseUrl) => {
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
  normalizeUrlFn: customNormalize,
})
```

## Interface

```typescript
type DiscoverNormalizeUrlFn = (url: string, baseUrl: string | undefined) => string
```

## Use Cases

### Removing Query Parameters

Strip unnecessary query parameters:

```typescript
const normalizeUrl: DiscoverNormalizeUrlFn = (url, baseUrl) => {
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
const normalizeUrl: DiscoverNormalizeUrlFn = (url, baseUrl) => {
  const resolved = new URL(url, baseUrl)
  resolved.protocol = 'https:'
  return resolved.href
}
```

### Removing Trailing Slashes

Normalize paths by removing trailing slashes:

```typescript
const normalizeUrl: DiscoverNormalizeUrlFn = (url, baseUrl) => {
  const resolved = new URL(url, baseUrl)
  resolved.pathname = resolved.pathname.replace(/\/+$/, '')
  return resolved.href
}
```

### Custom Domain Handling

Rewrite URLs for specific domains:

```typescript
const normalizeUrl: DiscoverNormalizeUrlFn = (url, baseUrl) => {
  const resolved = new URL(url, baseUrl)

  // Use feeds subdomain for specific sites
  if (resolved.hostname === 'example.com') {
    resolved.hostname = 'feeds.example.com'
  }

  return resolved.href
}
```

## Combining with Other Options

URL normalization happens before validation, so it works with all other options:

```typescript
const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  normalizeUrlFn: customNormalize,
  extractFn: customExtractor,
  concurrency: 3,
})
```

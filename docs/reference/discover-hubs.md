---
title: "Reference: discoverHubs"
---

# discoverHubs

Discovers WebSub hubs from a feed or webpage.

## Signature

```typescript
function discoverHubs(
  input: DiscoverInput,
  options?: DiscoverHubsOptions,
): Promise<Array<HubResult>>
```

## Parameters

### input

The URL to discover hubs from. Can be a string or an object:

```typescript
// String - URL to fetch and scan
discoverHubs('https://example.com/feed.xml')

// Object - provide existing content/headers
discoverHubs({
  url: 'https://example.com/feed.xml',
  content: feedContent,
  headers: responseHeaders,
})
```

### options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `methods` | `DiscoverHubsMethodsConfig` | all | Methods to use |
| `fetchFn` | `DiscoverFetchFn` | native fetch | Custom fetch function |
| `resolveUrlFn` | `DiscoverResolveUrlFn` | resolve relative | Custom URL resolution |

#### methods

Array of discovery methods to use:

```typescript
type DiscoverHubsMethodsConfig = Array<'headers' | 'html' | 'feed'>
```

- `headers` — Parse HTTP `Link` headers for `rel="hub"`.
- `feed` — Extract hub links from feed content (Atom, RSS, JSON Feed).
- `html` — Scan for `<link rel="hub">` elements.

## Return Value

Returns a promise that resolves to an array of hub results:

```typescript
type HubResult = {
  hub: string   // Hub URL to subscribe to
  topic: string // Feed URL the hub serves updates for
}
```

Example result:

```typescript
{
  hub: 'https://pubsubhubbub.appspot.com',
  topic: 'https://example.com/feed.xml',
}
```

## Examples

### Basic Usage

```typescript
import { discoverHubs } from 'feedscout'

const hubs = await discoverHubs('https://example.com/feed.xml')
```

### With Specific Methods

```typescript
const hubs = await discoverHubs('https://example.com/feed.xml', {
  methods: ['headers', 'feed'],
})
```

### With Existing Content

```typescript
const response = await fetch('https://example.com/feed.xml')
const content = await response.text()

const hubs = await discoverHubs(
  {
    url: 'https://example.com/feed.xml',
    content: await response.text(),
    headers: response.headers,
  },
  {
    methods: ['headers', 'feed'],
  },
)
```

### With Custom HTTP Client

```typescript
import type { DiscoverFetchFn } from 'feedscout'

const myCustomFetch: DiscoverFetchFn = async (url, options) => {
  // Handle the request and return response here.
}

const hubs = await discoverHubs('https://example.com/feed.xml', {
  methods: ['headers', 'feed'],
  fetchFn: myCustomFetch,
})
```

See [Customize Data Fetching](/customization/data-fetching) for examples with Axios, Got, Ky, and more.

### With Custom URL Resolution

```typescript
import type { DiscoverResolveUrlFn } from 'feedscout'

const resolveUrl: DiscoverResolveUrlFn = (url, baseUrl) => {
  const resolved = new URL(url, baseUrl)
  resolved.protocol = 'https:'
  return resolved.href
}

const hubs = await discoverHubs('https://example.com/feed.xml', {
  resolveUrlFn: resolveUrl,
})
```

See [Customize URL Resolution](/customization/url-resolution) for more examples.


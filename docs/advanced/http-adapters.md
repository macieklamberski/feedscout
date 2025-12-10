---
prev: Hubs
next: Custom Extractors
---

# HTTP Adapters

Feedscout uses adapters to make HTTP requests. By default, it uses the native `fetch()` API, but you can use adapters for other HTTP libraries.

## Available Adapters

| Adapter | Library | Import |
|---------|---------|--------|
| `createNativeFetchAdapter` | Native `fetch` | `feedscout/adapters` |
| `createAxiosAdapter` | [Axios](https://axios-http.com) | `feedscout/adapters` |
| `createGotAdapter` | [Got](https://github.com/sindresorhus/got) | `feedscout/adapters` |
| `createKyAdapter` | [Ky](https://github.com/sindresorhus/ky) | `feedscout/adapters` |

## Using Adapters

### Native Fetch (Default)

Native fetch is used by default. You don't need to specify an adapter:

```typescript
import { discoverFeeds } from 'feedscout'

const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
})
```

You can also configure the native fetch adapter with base options:

```typescript
import { createNativeFetchAdapter } from 'feedscout/adapters'

const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  fetchFn: createNativeFetchAdapter({
    headers: { 'User-Agent': 'MyApp/1.0' },
  }),
})
```

### Axios

```typescript
import axios from 'axios'
import { discoverFeeds } from 'feedscout'
import { createAxiosAdapter } from 'feedscout/adapters'

const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  fetchFn: createAxiosAdapter(axios),
})
```

### Got

```typescript
import got from 'got'
import { discoverFeeds } from 'feedscout'
import { createGotAdapter } from 'feedscout/adapters'

const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  fetchFn: createGotAdapter(got),
})
```

### Ky

```typescript
import ky from 'ky'
import { discoverFeeds } from 'feedscout'
import { createKyAdapter } from 'feedscout/adapters'

const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  fetchFn: createKyAdapter(ky),
})
```

## Custom Fetch Functions

You can create a custom fetch function by implementing the `DiscoverFetchFn` type:

```typescript
import type { DiscoverFetchFn } from 'feedscout'

const customFetch: DiscoverFetchFn = async (url, options) => {
  return await myHttpClient.request({
    url,
    method: options?.method ?? 'GET',
    headers: options?.headers,
  })
}

const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  fetchFn: customFetch,
})
```

See the [DiscoverFetchFn](/reference/types#discoverfetchfn) type for the full interface.

## Configuring Instances

Pass a configured instance to use custom settings:

```typescript
import axios from 'axios'
import { createAxiosAdapter } from 'feedscout/adapters'

const client = axios.create({
  timeout: 5000,
  headers: { 'User-Agent': 'MyApp/1.0' },
})

const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  fetchFn: createAxiosAdapter(client),
})
```

## When to Use Adapters

Use adapters when you need:

- **Consistent HTTP client** — Use the same HTTP library across your app.
- **Custom configuration** — Timeouts, headers, proxies, etc.
- **Request interceptors** — Logging, authentication, retries.
- **Environment compatibility** — Some runtimes may not support native fetch.

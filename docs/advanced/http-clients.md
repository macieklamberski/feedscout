---
prev: Hubs
next: Custom Extractors
---

# Custom HTTP Clients

By default, Feedscout uses native `fetch` to perform HTTP requests. You can use any HTTP client by providing a custom `fetchFn` that handles requests and returns responses.

Below are copy-paste examples for popular HTTP clients. See the [`DiscoverFetchFn`](/reference/types#discoverfetchfn) type for the full interface.

## Axios

[Axios](https://axios-http.com) throws errors for non-2xx responses by default. Use `validateStatus: () => true` to prevent this, since Feedscout handles HTTP errors internally.

```typescript
import axios from 'axios'
import type { DiscoverFetchFn } from 'feedscout'

const axiosFetch: DiscoverFetchFn = async (url, options) => {
  const response = await axios({
    url,
    method: options?.method ?? 'GET',
    headers: options?.headers,
    validateStatus: () => true,
  })

  return {
    headers: new Headers(response.headers.toJSON() as Record<string, string>),
    body: response.data,
    url: response.request?.res?.responseUrl ?? url,
    status: response.status,
    statusText: response.statusText,
  }
}

const feeds = await discoverFeeds('https://example.com', {
  fetchFn: axiosFetch,
})
```

To use a configured Axios instance:

```typescript
const client = axios.create({
  timeout: 5000,
  headers: { 'User-Agent': 'MyApp/1.0' },
})

const axiosFetch: DiscoverFetchFn = async (url, options) => {
  const response = await client({
    url,
    method: options?.method ?? 'GET',
    headers: options?.headers,
    validateStatus: () => true,
  })

  return {
    headers: new Headers(response.headers.toJSON() as Record<string, string>),
    body: response.data,
    url: response.request?.res?.responseUrl ?? url,
    status: response.status,
    statusText: response.statusText,
  }
}
```

## Got

[Got](https://github.com/sindresorhus/got) throws errors for non-2xx responses by default. Use `throwHttpErrors: false` to prevent this.

```typescript
import got from 'got'
import type { DiscoverFetchFn } from 'feedscout'

const gotFetch: DiscoverFetchFn = async (url, options) => {
  const response = await got(url, {
    method: options?.method ?? 'GET',
    headers: options?.headers,
    throwHttpErrors: false,
  })

  return {
    headers: new Headers(response.headers as Record<string, string>),
    body: response.body,
    url: response.url,
    status: response.statusCode,
    statusText: response.statusMessage ?? '',
  }
}

const feeds = await discoverFeeds('https://example.com', {
  fetchFn: gotFetch,
})
```

## Ky

[Ky](https://github.com/sindresorhus/ky) is a fetch wrapper that throws errors for non-2xx responses by default. Use `throwHttpErrors: false` to prevent this.

```typescript
import ky from 'ky'
import type { DiscoverFetchFn } from 'feedscout'

const kyFetch: DiscoverFetchFn = async (url, options) => {
  const response = await ky(url, {
    method: options?.method ?? 'GET',
    headers: options?.headers,
    throwHttpErrors: false,
  })

  return {
    headers: response.headers,
    body: await response.text(),
    url: response.url,
    status: response.status,
    statusText: response.statusText,
  }
}

const feeds = await discoverFeeds('https://example.com', {
  fetchFn: kyFetch,
})
```

## ofetch

[ofetch](https://github.com/unjs/ofetch) is a better fetch API that works across Node, browsers, and workers.

```typescript
import { ofetch } from 'ofetch'
import type { DiscoverFetchFn } from 'feedscout'

const ofetchFn: DiscoverFetchFn = async (url, options) => {
  const response = await ofetch.raw(url, {
    method: options?.method ?? 'GET',
    headers: options?.headers,
    ignoreResponseError: true,
  })

  return {
    headers: response.headers,
    body: response._data,
    url: response.url,
    status: response.status,
    statusText: response.statusText,
  }
}

const feeds = await discoverFeeds('https://example.com', {
  fetchFn: ofetchFn,
})
```

## Native Fetch with Customizations

To customize the default fetch behavior (e.g., add headers or credentials):

```typescript
import type { DiscoverFetchFn } from 'feedscout'

const customFetch: DiscoverFetchFn = async (url, options) => {
  const response = await fetch(url, {
    method: options?.method ?? 'GET',
    headers: {
      'User-Agent': 'MyApp/1.0',
      ...options?.headers,
    },
    credentials: 'include',
  })

  return {
    headers: response.headers,
    body: await response.text(),
    url: response.url,
    status: response.status,
    statusText: response.statusText,
  }
}

const feeds = await discoverFeeds('https://example.com', {
  fetchFn: customFetch,
})
```

## When to Use Custom HTTP Clients

Use a custom `fetchFn` when you need:

- **Consistent HTTP client** — Use the same library across your app.
- **Custom configuration** — Timeouts, proxies, retry logic.
- **Request interceptors** — Logging, authentication, caching.
- **Environment compatibility** — Some runtimes may not support native fetch.

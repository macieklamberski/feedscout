---
title: "Customization: Data Fetching"
---

# Customize Data Fetching

By default, Feedscout uses native `fetch` to perform HTTP requests. You can use any HTTP client by providing a custom `fetchFn` that handles requests and returns responses. The same function works for favicon enrichers, which can send a POST with a body, so pass the method and body through.

Below are copy-paste examples for popular HTTP clients. See the [`FetchFn`](/reference/types#fetchfn) type for the full interface.

## Request Headers

Discovery passes an `Accept` header in `options.headers` when it fetches the input page, the site of a feed and each candidate URL: an HTML-first one for a page and one that prefers the format being discovered for a candidate. Hub discovery fetches its input with a feed-first `Accept` that takes HTML after the feed types, since its input is usually a feed. A platform handler or a favicon enricher can fetch without one, and the default `fetchFn` then sends the HTML-first `Accept`, since some servers answer a page with its feed for `*/*` and answer a request with no `Accept` with 403. A custom `fetchFn` should forward `options.headers`, as every example below does. One that drops them sends its client's default `Accept`, and a server can then answer with a different page or refuse the request.

## Axios

[Axios](https://axios-http.com) throws errors for non-2xx responses by default. Use `validateStatus: () => true` to prevent this, since Feedscout handles HTTP errors internally. Set `responseType: 'text'` as well, so Axios does not parse JSON Feed responses into objects.

```typescript
import axios from 'axios'
import type { FetchFn } from 'feedscout'

const axiosFetch: FetchFn = async (url, options) => {
  const response = await axios({
    url,
    method: options?.method ?? 'GET',
    headers: options?.headers,
    data: options?.body,
    responseType: 'text',
    validateStatus: () => true,
  })

  return {
    headers: new Headers(response.headers as Record<string, string>),
    body: response.data,
    url: response.request?.res?.responseUrl ?? url,
    status: response.status,
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

const axiosFetch: FetchFn = async (url, options) => {
  const response = await client({
    url,
    method: options?.method ?? 'GET',
    headers: options?.headers,
    data: options?.body,
    responseType: 'text',
    validateStatus: () => true,
  })

  return {
    headers: new Headers(response.headers as Record<string, string>),
    body: response.data,
    url: response.request?.res?.responseUrl ?? url,
    status: response.status,
  }
}
```

## Got

[Got](https://github.com/sindresorhus/got) throws errors for non-2xx responses by default. Use `throwHttpErrors: false` to prevent this.

```typescript
import got from 'got'
import type { FetchFn } from 'feedscout'

const gotFetch: FetchFn = async (url, options) => {
  const response = await got(url, {
    method: options?.method ?? 'GET',
    headers: options?.headers,
    body: options?.body,
    throwHttpErrors: false,
  })

  return {
    headers: new Headers(response.headers as Record<string, string>),
    body: response.body,
    url: response.url,
    status: response.statusCode,
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
import type { FetchFn } from 'feedscout'

const kyFetch: FetchFn = async (url, options) => {
  const response = await ky(url, {
    method: options?.method ?? 'GET',
    headers: options?.headers,
    body: options?.body,
    throwHttpErrors: false,
  })

  return {
    headers: response.headers,
    body: await response.text(),
    url: response.url,
    status: response.status,
  }
}

const feeds = await discoverFeeds('https://example.com', {
  fetchFn: kyFetch,
})
```

## Native Fetch with Customizations

To customize the default fetch behavior (e.g., add headers or credentials):

```typescript
import type { FetchFn } from 'feedscout'

const customFetch: FetchFn = async (url, options) => {
  const response = await fetch(url, {
    method: options?.method ?? 'GET',
    headers: {
      'User-Agent': 'MyApp/1.0',
      ...options?.headers,
    },
    body: options?.body,
    credentials: 'include',
  })

  return {
    headers: response.headers,
    body: await response.text(),
    url: response.url,
    status: response.status,
  }
}

const feeds = await discoverFeeds('https://example.com', {
  fetchFn: customFetch,
})
```

## When to Use Custom HTTP Clients

Use a custom `fetchFn` when you need:

- **Consistent HTTP client**: Use the same library across your app.
- **Custom configuration**: Timeouts, proxies, retry logic.
- **Request interceptors**: Logging, authentication, caching.
- **Environment compatibility**: Some runtimes may not support native fetch.

## Requests to Unsafe Addresses

Feedscout fetches the URLs a page names, and it does not check where they lead. A link, a `Link` header or a redirect can point at `localhost`, a private network address or a cloud metadata endpoint, and each one reaches `fetchFn` unchanged.

On a server that discovers feeds for URLs its users submit, check the address in `fetchFn`. Resolve the host, refuse loopback, private and link-local addresses, and run the same check on every redirect. Feedscout also sets no limit on response size, request time or the number of redirects, so those belong in `fetchFn` too.

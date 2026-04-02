import { parseFeed } from 'feedsmith'
import type { Atom, DeepPartial } from 'feedsmith/types'
import locales from '../locales.json' with { type: 'json' }
import type {
  DiscoverFetchFn,
  DiscoverInput,
  DiscoverInputObject,
  DiscoverMethodsConfig,
  DiscoverMethodsConfigDefaults,
  DiscoverMethodsConfigInternal,
  DiscoverResolveSiteUrlFn,
  DiscoverResolveUrlFn,
  DiscoverUriEntry,
} from '../types.js'
import { resolveUrl } from '../utils.js'

export const defaultFetchFn: DiscoverFetchFn = async (url, options) => {
  const response = await fetch(url, {
    method: options?.method ?? 'GET',
    headers: options?.headers,
  })

  return {
    headers: response.headers,
    body: await response.text(),
    url: response.url,
    status: response.status,
    statusText: response.statusText,
  }
}

export const normalizeInput = async (
  input: DiscoverInput,
  fetchFn: DiscoverFetchFn,
): Promise<DiscoverInputObject> => {
  if (typeof input === 'object') {
    return input
  }

  const response = await fetchFn(input)

  return {
    url: response.url,
    // TODO: Support streams here.
    content: typeof response.body === 'string' ? response.body : '',
    headers: response.headers,
  }
}

const getLinkOfType = (links: Array<DeepPartial<Atom.Link<string>>> | undefined, rel: string) => {
  return links?.find((link) => link.rel === rel)
}

export const getFeedSiteUrl = (parsed: ReturnType<typeof parseFeed>): string | undefined => {
  const { format, feed } = parsed

  if (format === 'rss' || format === 'rdf') {
    return getLinkOfType(feed.atom?.links, 'alternate')?.href ?? feed.link
  }

  if (format === 'atom') {
    return getLinkOfType(feed.links, 'alternate')?.href
  }

  if (format === 'json') {
    return feed.home_page_url
  }
}

// TODO: parseFeed is called here and again in discoverUrisFromFeed for the favicons
// discoverer. Consider caching the parsed result to avoid double parsing.
export const defaultResolveSiteUrlFn: DiscoverResolveSiteUrlFn = (input) => {
  if (!input.content) {
    return
  }

  try {
    let siteUrl = getFeedSiteUrl(parseFeed(input.content))

    // Fall back to origin if no site URL found in feed metadata.
    if (!siteUrl) {
      try {
        siteUrl = new URL(input.url).origin
      } catch {}
    } else {
      // Resolve relative site URLs against the feed URL.
      siteUrl = resolveUrl(siteUrl, input.url)
    }

    // Avoid re-fetching the same URL.
    if (siteUrl && new URL(siteUrl).href === new URL(input.url).href) {
      return
    }

    return siteUrl
  } catch {}
}

export const normalizeUriEntry = (
  entry: DiscoverUriEntry,
  resolveUrlFn: DiscoverResolveUrlFn,
  baseUrl: string | undefined,
): DiscoverUriEntry => {
  if (typeof entry.uri === 'string') {
    return { ...entry, uri: resolveUrlFn(entry.uri, baseUrl) ?? entry.uri }
  }

  return {
    ...entry,
    uri: entry.uri.map((uri) => resolveUrlFn(uri, baseUrl) ?? uri),
  }
}

export const normalizeMethodsConfig = (
  sourceInput: DiscoverInputObject,
  siteInput: DiscoverInputObject | undefined,
  methods: DiscoverMethodsConfig,
  defaults: DiscoverMethodsConfigDefaults,
): DiscoverMethodsConfigInternal => {
  const resolvedInput = siteInput ?? sourceInput

  // Step 1: Normalize methods (array → object, true → {}).
  const methodsObj = Array.isArray(methods)
    ? Object.fromEntries(methods.map((method) => [method, true]))
    : methods

  // Step 2: Build internal methods config.
  const methodsConfig: DiscoverMethodsConfigInternal = {}

  if (methodsObj.platform && defaults.platform) {
    if (!resolvedInput.url || resolvedInput.url === '') {
      throw new Error(locales.errors.platformMethodRequiresUrl)
    }

    const platformOptions = methodsObj.platform === true ? {} : methodsObj.platform

    methodsConfig.platform = {
      content: resolvedInput.content,
      headers: resolvedInput.headers,
      options: {
        ...defaults.platform,
        ...platformOptions,
        baseUrl: resolvedInput.url,
      },
    }
  }

  if (methodsObj.feed && defaults.feed) {
    if (sourceInput.content === undefined) {
      throw new Error(locales.errors.feedMethodRequiresContent)
    }

    const feedOptions = methodsObj.feed === true ? {} : methodsObj.feed

    methodsConfig.feed = {
      content: sourceInput.content,
      options: {
        ...defaults.feed,
        ...feedOptions,
      },
    }
  }

  if (methodsObj.html && defaults.html) {
    if (resolvedInput.content === undefined) {
      throw new Error(locales.errors.htmlMethodRequiresContent)
    }

    const htmlOptions = methodsObj.html === true ? {} : methodsObj.html

    methodsConfig.html = {
      html: resolvedInput.content,
      options: {
        ...defaults.html,
        ...htmlOptions,
        baseUrl: resolvedInput.url,
      },
    }
  }

  if (methodsObj.headers && defaults.headers) {
    if (resolvedInput.headers === undefined) {
      throw new Error(locales.errors.headersMethodRequiresHeaders)
    }

    const headersOptions = methodsObj.headers === true ? {} : methodsObj.headers

    methodsConfig.headers = {
      headers: resolvedInput.headers,
      options: {
        ...defaults.headers,
        ...headersOptions,
        baseUrl: resolvedInput.url,
      },
    }
  }

  if (methodsObj.guess && defaults.guess) {
    if (!resolvedInput.url || resolvedInput.url === '') {
      throw new Error(locales.errors.guessMethodRequiresUrl)
    }

    const guessOptions = methodsObj.guess === true ? {} : methodsObj.guess

    methodsConfig.guess = {
      options: {
        ...defaults.guess,
        ...guessOptions,
        baseUrl: resolvedInput.url,
      },
    }
  }

  return methodsConfig
}

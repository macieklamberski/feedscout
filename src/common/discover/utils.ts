import type { Atom } from 'feedsmith'
import locales from '../locales.json' with { type: 'json' }
import type {
  DiscoverFetchFn,
  DiscoverInput,
  DiscoverInputObject,
  DiscoverMethodsConfig,
  DiscoverMethodsConfigDefaults,
  DiscoverMethodsConfigInternal,
  DiscoverOnErrorFn,
  DiscoverResolveUrlFn,
  DiscoverUriEntry,
} from '../types.js'
import type { FeedMethodData } from '../uris/feed/types.js'
import { isObject } from '../utils.js'

export const normalizeInput = async (
  input: DiscoverInput,
  fetchFn: DiscoverFetchFn,
  onError?: DiscoverOnErrorFn,
): Promise<DiscoverInputObject> => {
  if (isObject(input)) {
    return input
  }

  try {
    const response = await fetchFn(input)

    return {
      url: response.url,
      // TODO: Support streams here.
      content: typeof response.body === 'string' ? response.body : undefined,
      headers: response.headers,
    }
  } catch (error) {
    onError?.(error, { phase: 'fetchInput', url: input })
  }

  // When the fetch fails, return the URL without content so that URL-only
  // methods like guess can still run.
  return { url: input }
}

const getLinkOfType = (links: Array<Atom.Link<string>> | undefined, rel: string) => {
  return links?.find((link) => link.rel === rel)
}

export const getFeedSiteUrl = (parsed: FeedMethodData): string | undefined => {
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

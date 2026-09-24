import type { Atom } from 'feedsmith'
import { isObject } from 'trousse'
import locales from '../locales.json' with { type: 'json' }
import type {
  DiscoverErrorContext,
  DiscoverInput,
  DiscoverInputObject,
  DiscoverMethodsConfig,
  DiscoverMethodsConfigDefaults,
  DiscoverMethodsConfigInternal,
  DiscoverOnErrorFn,
  DiscoverResolveUrlFn,
  DiscoverUriEntry,
  FetchFn,
} from '../types.js'
import type { FeedMethodData } from '../uris/feed/types.js'

export const normalizeInput = async (
  input: DiscoverInput,
  fetchFn: FetchFn,
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
      status: response.status,
    }
  } catch (error) {
    reportError(onError, error, { phase: 'fetchInput', url: input })
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

const isThenable = (value: unknown): value is PromiseLike<unknown> => {
  return isObject(value) && 'then' in value && typeof value.then === 'function'
}

// onError is where failures get reported, so an error thrown from it has nowhere to go. It is
// swallowed, so that a broken callback cannot end discovery.
export const reportError = (
  onError: DiscoverOnErrorFn | undefined,
  error: unknown,
  context: DiscoverErrorContext,
): void => {
  try {
    const result: unknown = onError?.(error, context)

    // A function typed as sync can still be async. Its rejection has nowhere to go either.
    if (isThenable(result)) {
      void Promise.resolve(result).catch(() => {})
    }
  } catch {}
}

// Runs a user-supplied function. A throw never ends discovery: it is reported through onError
// and the fallback is used. The fallback also stands in when the function returns nothing, and
// it is the URL named in the report unless another one is given.
export const attempt = <TValue, TFallback>(
  callback: () => TValue,
  fallback: TFallback,
  phase: DiscoverErrorContext['phase'],
  onError: DiscoverOnErrorFn | undefined,
  url?: string,
): NonNullable<TValue> | TFallback => {
  const context: DiscoverErrorContext = {
    phase,
    url: url ?? (typeof fallback === 'string' ? fallback : undefined),
  }

  try {
    const result = callback()

    // A function typed as sync can still be async. A promise is no value to a sync caller, so
    // the fallback is used, and a rejection is reported the same way as a throw.
    if (isThenable(result)) {
      void Promise.resolve(result).catch((error) => reportError(onError, error, context))

      return fallback
    }

    return result ?? fallback
  } catch (error) {
    reportError(onError, error, context)

    return fallback
  }
}

export const normalizeUriEntry = (
  entry: DiscoverUriEntry,
  resolveUrlFn: DiscoverResolveUrlFn,
  baseUrl: string | undefined,
  onError?: DiscoverOnErrorFn,
): DiscoverUriEntry => {
  const { uri } = entry

  if (typeof uri === 'string') {
    return {
      ...entry,
      uri: attempt(() => resolveUrlFn(uri, baseUrl), uri, 'resolveUrlFn', onError),
    }
  }

  return {
    ...entry,
    uri: uri.map((alternative) => {
      return attempt(() => resolveUrlFn(alternative, baseUrl), alternative, 'resolveUrlFn', onError)
    }),
  }
}

export const normalizeMethodsConfig = (
  sourceInput: DiscoverInputObject,
  siteInput: DiscoverInputObject | undefined,
  methods: DiscoverMethodsConfig,
  defaults: DiscoverMethodsConfigDefaults,
  hasInputFetchFailed = false,
): DiscoverMethodsConfigInternal => {
  const resolvedInput = siteInput ?? sourceInput

  // Missing content or headers is a usage error, so it throws. After a failed input fetch the
  // caller did nothing wrong and the failure is already reported, so the method is skipped.
  const isAvailable = <TValue>(value: TValue | undefined, message: string): value is TValue => {
    if (value !== undefined) {
      return true
    }

    if (!hasInputFetchFailed) {
      throw new Error(message)
    }

    return false
  }

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

  if (
    methodsObj.feed &&
    defaults.feed &&
    isAvailable(sourceInput.content, locales.errors.feedMethodRequiresContent)
  ) {
    const feedOptions = methodsObj.feed === true ? {} : methodsObj.feed

    methodsConfig.feed = {
      content: sourceInput.content,
      options: {
        ...defaults.feed,
        ...feedOptions,
      },
    }
  }

  if (
    methodsObj.html &&
    defaults.html &&
    isAvailable(resolvedInput.content, locales.errors.htmlMethodRequiresContent)
  ) {
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

  if (
    methodsObj.headers &&
    defaults.headers &&
    isAvailable(resolvedInput.headers, locales.errors.headersMethodRequiresHeaders)
  ) {
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
        // Page HTML for section-link scanning; explicit method options may override it.
        content: resolvedInput.content,
        ...guessOptions,
        baseUrl: resolvedInput.url,
      },
    }
  }

  return methodsConfig
}

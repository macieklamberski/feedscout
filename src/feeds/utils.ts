import type { FetchFn } from '../common/types.js'
import { defaultGuessOptions, defaultHeadersOptions, defaultHtmlOptions } from '../defaults.js'
import locales from '../locales.json' with { type: 'json' }
import type { Config as InternalMethodsConfig } from '../methods/types.js'
import type { DiscoverFeedsInput, DiscoverFeedsInputObject, MethodsConfig } from './types.js'

/**
 * Normalizes input to a consistent object format.
 *
 * Handles:
 * - String input: fetches the URL to get content and headers
 * - Object input: uses provided data as-is
 */
export const normalizeInput = async (
  input: DiscoverFeedsInput,
  fetchFn?: FetchFn,
): Promise<DiscoverFeedsInputObject> => {
  if (typeof input === 'object') {
    return input
  }

  if (!fetchFn) {
    throw new Error(locales.errors.fetchFnRequired)
  }

  const response = await fetchFn(input)

  return {
    url: response.url,
    // TODO: Support streams here.
    content: typeof response.body === 'string' ? response.body : '',
    headers: response.headers,
  }
}

/**
 * Normalizes user-facing methods config to internal methods config format.
 *
 * Handles:
 * - Array → object conversion
 * - true → {} normalization
 * - Merging with default options
 * - Building complete method configurations with input data
 */
export const normalizeMethodsConfig = (
  input: { url: string; content?: string; headers?: Headers },
  methods: MethodsConfig,
): InternalMethodsConfig => {
  // Step 1: Normalize methods (array → object, true → {}).
  const methodsObj = Array.isArray(methods)
    ? Object.fromEntries(methods.map((method) => [method, true]))
    : methods

  // Step 2: Build internal methods config.
  const methodsConfig: InternalMethodsConfig = {}

  if (methodsObj.html) {
    if (input.content === undefined) {
      throw new Error(locales.errors.htmlMethodRequiresContent)
    }

    const htmlOptions = methodsObj.html === true ? {} : methodsObj.html

    methodsConfig.html = {
      html: input.content,
      options: {
        ...defaultHtmlOptions,
        ...htmlOptions,
        baseUrl: input.url,
      },
    }
  }

  if (methodsObj.headers) {
    if (input.headers === undefined) {
      throw new Error(locales.errors.headersMethodRequiresHeaders)
    }

    const headersOptions = methodsObj.headers === true ? {} : methodsObj.headers

    methodsConfig.headers = {
      headers: input.headers,
      options: {
        ...defaultHeadersOptions,
        ...headersOptions,
        baseUrl: input.url,
      },
    }
  }

  if (methodsObj.guess) {
    if (!input.url || input.url === '') {
      throw new Error(locales.errors.guessMethodRequiresUrl)
    }

    const guessOptions = methodsObj.guess === true ? {} : methodsObj.guess

    methodsConfig.guess = {
      options: {
        ...defaultGuessOptions,
        ...guessOptions,
        baseUrl: input.url,
      },
    }
  }

  return methodsConfig
}

export const processConcurrently = async <T>(
  items: Array<T>,
  processFn: (item: T) => Promise<void>,
  options: {
    concurrency: number
    shouldStop?: () => boolean
  },
): Promise<void> => {
  const active = new Set<Promise<void>>()

  let index = 0

  while (index < items.length || active.size > 0) {
    if (options.shouldStop?.()) {
      break
    }

    // Fill up active slots.
    while (active.size < options.concurrency && index < items.length) {
      const item = items[index++]

      const promise = processFn(item)
        .catch(() => {
          // Swallow errors - let processFn handle its own error logic.
        })
        .finally(() => {
          active.delete(promise)
        })

      active.add(promise)
    }

    // Wait for at least one to complete.
    if (active.size > 0) {
      await Promise.race(active)
    }
  }
}

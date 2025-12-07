import { createNativeFetchAdapter } from '../common/discover/adapters.js'
import { discover } from '../common/discover/index.js'
import type {
  DiscoverFetchFn,
  DiscoverInput,
  DiscoverMethodsConfig,
  DiscoverOptions,
  DiscoverResult,
} from '../common/types.js'
import { normalizeUrl } from '../common/utils.js'
import {
  defaultGuessOptions,
  defaultHeadersOptions,
  defaultHtmlOptions,
  defaultPlatformOptions,
} from './defaults.js'
import { feedsmithExtractor } from './extractors.js'
import { discoverPlatformUris } from './platform/index.js'
import type { PlatformMethodOptions } from './platform/types.js'
import type { FeedResultValid } from './types.js'

const getPlatformOptions = (methods: DiscoverMethodsConfig): PlatformMethodOptions | undefined => {
  if (Array.isArray(methods)) {
    return methods.includes('platform') ? defaultPlatformOptions : undefined
  }

  if (!methods.platform) {
    return undefined
  }

  if (methods.platform === true) {
    return defaultPlatformOptions
  }

  return {
    ...defaultPlatformOptions,
    ...methods.platform,
  }
}

const getInputUrl = (input: DiscoverInput): string => {
  return typeof input === 'string' ? input : input.url
}

export const discoverFeeds = async <TValid extends FeedResultValid = FeedResultValid>(
  input: DiscoverInput,
  options: DiscoverOptions<TValid>,
): Promise<Array<DiscoverResult<TValid>>> => {
  const fetchFn: DiscoverFetchFn = options.fetchFn ?? createNativeFetchAdapter()
  const platformOptions = getPlatformOptions(options.methods)

  let platformUris: Array<string> = []

  if (platformOptions) {
    try {
      const url = getInputUrl(input)

      new URL(url) // Validate URL
      platformUris = await discoverPlatformUris(url, platformOptions, fetchFn)
    } catch {
      // Invalid URL or platform discovery failed - continue with other methods.
    }
  }

  return discover<TValid>(
    input,
    {
      ...options,
      fetchFn,
      extractFn: options.extractFn ?? feedsmithExtractor,
      normalizeUrlFn: options.normalizeUrlFn ?? normalizeUrl,
      additionalUris: [...platformUris, ...(options.additionalUris ?? [])],
    },
    {
      html: defaultHtmlOptions,
      headers: defaultHeadersOptions,
      guess: defaultGuessOptions,
    },
  )
}

import {
  defaultFetchFn,
  defaultResolveSiteUrlFn,
  defaultResolveUrlFn,
} from '../common/discover/defaults.js'
import { discover } from '../common/discover/index.js'
import type { DiscoverInput, DiscoverOptions, DiscoverResult } from '../common/types.js'
import { methods as defaultMethods } from './config.js'
import {
  defaultFeedOptions,
  defaultGuessOptions,
  defaultHeadersOptions,
  defaultHtmlOptions,
  defaultPlatformOptions,
} from './defaults.js'
import { defaultExtractFn } from './extractors.js'
import type { FaviconResult } from './types.js'

export const discoverFavicons = <TValid extends FaviconResult = FaviconResult>(
  input: DiscoverInput,
  options: DiscoverOptions<TValid> = {},
): Promise<Array<DiscoverResult<TValid>>> => {
  return discover<TValid>(
    input,
    {
      ...options,
      methods: options.methods ?? [...defaultMethods],
      fetchFn: options.fetchFn ?? defaultFetchFn,
      extractFn: options.extractFn ?? defaultExtractFn,
      resolveUrlFn: options.resolveUrlFn ?? defaultResolveUrlFn,
      resolveSiteUrlFn: options.resolveSiteUrlFn ?? defaultResolveSiteUrlFn,
    },
    {
      platform: defaultPlatformOptions,
      feed: defaultFeedOptions,
      html: defaultHtmlOptions,
      headers: defaultHeadersOptions,
      guess: defaultGuessOptions,
    },
  )
}

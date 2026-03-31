import { discover } from '../common/discover/index.js'
import { defaultFetchFn, defaultResolveSiteUrlFn } from '../common/discover/utils.js'
import type { DiscoverInput, DiscoverOptions, DiscoverResult } from '../common/types.js'
import { normalizeUrl } from '../common/utils.js'
import {
  defaultFeedOptions,
  defaultGuessOptions,
  defaultHeadersOptions,
  defaultHtmlOptions,
  defaultPlatformOptions,
} from './defaults.js'
import { defaultExtractor } from './extractors.js'
import type { FaviconResult } from './types.js'

export const discoverFavicons = <TValid extends FaviconResult = FaviconResult>(
  input: DiscoverInput,
  options: DiscoverOptions<TValid> = {},
): Promise<Array<DiscoverResult<TValid>>> => {
  return discover<TValid>(
    input,
    {
      ...options,
      methods: options.methods ?? ['platform', 'feed', 'html', 'headers', 'guess'],
      fetchFn: options.fetchFn ?? defaultFetchFn,
      extractFn: options.extractFn ?? defaultExtractor,
      normalizeUrlFn: options.normalizeUrlFn ?? normalizeUrl,
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

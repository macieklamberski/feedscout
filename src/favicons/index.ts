import {
  defaultFetchFn,
  defaultResolveSiteUrlFn,
  defaultResolveUrlFn,
} from '../common/discover/defaults.js'
import { discover } from '../common/discover/index.js'
import type { DiscoverInput, DiscoverResult } from '../common/types.js'
import {
  defaultFeedOptions,
  defaultGuessOptions,
  defaultHeadersOptions,
  defaultHtmlOptions,
  defaultPlatformOptions,
} from './defaults.js'
import { defaultExtractFn } from './extractors.js'
import type { DiscoverFaviconsOptions, FaviconResult } from './types.js'

export const discoverFavicons = <TValid extends FaviconResult = FaviconResult>(
  input: DiscoverInput,
  options: DiscoverFaviconsOptions<TValid> = {},
): Promise<Array<DiscoverResult<TValid>>> => {
  const { enrichFn, ...discoverOptions } = options

  return discover<TValid>(
    input,
    {
      ...discoverOptions,
      methods: options.methods ?? ['platform', 'feed', 'html', 'headers', 'guess'],
      fetchFn: options.fetchFn ?? defaultFetchFn,
      extractFn: options.extractFn ?? defaultExtractFn,
      resolveUrlFn: options.resolveUrlFn ?? defaultResolveUrlFn,
      resolveSiteUrlFn: options.resolveSiteUrlFn ?? defaultResolveSiteUrlFn,
    },
    {
      platform: { ...defaultPlatformOptions, enrichFn },
      feed: defaultFeedOptions,
      html: defaultHtmlOptions,
      headers: defaultHeadersOptions,
      guess: defaultGuessOptions,
    },
  )
}

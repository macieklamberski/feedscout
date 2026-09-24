import {
  defaultFetchFn,
  defaultResolveSiteUrlFn,
  defaultResolveUrlFn,
} from '../common/discover/defaults.js'
import { discover } from '../common/discover/index.js'
import type { DiscoverEnrichFn, DiscoverInput, DiscoverResult } from '../common/types.js'
import {
  defaultFeedOptions,
  defaultGuessOptions,
  defaultHeadersOptions,
  defaultHtmlOptions,
  defaultPlatformOptions,
} from './defaults.js'
import { createEnrichFaviconFn } from './enrich.js'
import { defaultExtractFn } from './extractors.js'
import type { DiscoverFaviconsOptions, FaviconResult } from './types.js'

export const discoverFavicons = <TValid extends FaviconResult = FaviconResult>(
  input: DiscoverInput,
  options: DiscoverFaviconsOptions<TValid> = {},
): Promise<Array<DiscoverResult<TValid>>> => {
  const { enrichFn, ...discoverOptions } = options
  const fetchFn = options.fetchFn ?? defaultFetchFn

  // The built-in enrichers run with discovery's own fetch unless the consumer turns them off.
  const getEnrichFn = (): DiscoverEnrichFn | undefined => {
    if (enrichFn === false) {
      return
    }

    return enrichFn ?? createEnrichFaviconFn({ fetchFn })
  }

  return discover<TValid>(
    input,
    {
      ...discoverOptions,
      methods: options.methods ?? ['platform', 'feed', 'html', 'headers', 'guess'],
      fetchFn,
      extractFn: options.extractFn ?? defaultExtractFn,
      resolveUrlFn: options.resolveUrlFn ?? defaultResolveUrlFn,
      resolveSiteUrlFn: options.resolveSiteUrlFn ?? defaultResolveSiteUrlFn,
    },
    {
      platform: { ...defaultPlatformOptions, enrichFn: getEnrichFn() },
      feed: defaultFeedOptions,
      html: defaultHtmlOptions,
      headers: defaultHeadersOptions,
      guess: defaultGuessOptions,
    },
  )
}

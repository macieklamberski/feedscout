import { defaultFetchFn, defaultResolveUrlFn } from '../common/discover/defaults.js'
import { discover } from '../common/discover/index.js'
import type { DiscoverInput, DiscoverResult } from '../common/types.js'
import {
  defaultGuessOptions,
  defaultHeadersOptions,
  defaultHtmlOptions,
  defaultPlatformOptions,
  ignoredExtensions,
} from './defaults.js'
import { defaultExtractFn } from './extractors.js'
import type { DiscoverFeedsOptions, FeedResult } from './types.js'

export const discoverFeeds = <TValid extends FeedResult = FeedResult>(
  input: DiscoverInput,
  options: DiscoverFeedsOptions<TValid> = {},
): Promise<Array<DiscoverResult<TValid>>> => {
  const { enrichFn, ...discoverOptions } = options

  return discover<TValid>(
    input,
    {
      ...discoverOptions,
      methods: options.methods ?? ['platform', 'html', 'headers', 'guess'],
      fetchFn: options.fetchFn ?? defaultFetchFn,
      extractFn: options.extractFn ?? defaultExtractFn,
      resolveUrlFn: options.resolveUrlFn ?? defaultResolveUrlFn,
      ignoredExtensions,
      // No resolveSiteUrlFn — feeds discoverer early-returns in extractFn before site resolution.
    },
    {
      // Enrichers call third-party APIs, so they run only when the consumer passes enrichFn.
      platform: { ...defaultPlatformOptions, enrichFn },
      html: defaultHtmlOptions,
      headers: defaultHeadersOptions,
      guess: defaultGuessOptions,
    },
  )
}

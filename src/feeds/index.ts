import { defaultFetchFn, defaultResolveUrlFn, feedAccept } from '../common/discover/defaults.js'
import { discover } from '../common/discover/index.js'
import type { DiscoverInput, DiscoverOptions, DiscoverResult } from '../common/types.js'
import {
  defaultGuessOptions,
  defaultHeadersOptions,
  defaultHtmlOptions,
  defaultPlatformOptions,
  ignoredExtensions,
} from './defaults.js'
import { defaultExtractFn } from './extractors.js'
import type { FeedResult } from './types.js'

export const discoverFeeds = <TValid extends FeedResult = FeedResult>(
  input: DiscoverInput,
  options: DiscoverOptions<TValid, 'platform' | 'html' | 'headers' | 'guess'> = {},
): Promise<Array<DiscoverResult<TValid>>> => {
  return discover<TValid>(
    input,
    {
      ...options,
      methods: options.methods ?? ['platform', 'html', 'headers', 'guess'],
      fetchFn: options.fetchFn ?? defaultFetchFn,
      extractFn: options.extractFn ?? defaultExtractFn,
      resolveUrlFn: options.resolveUrlFn ?? defaultResolveUrlFn,
      ignoredExtensions,
      validateAccept: feedAccept,
      // No resolveSiteUrlFn — feeds discoverer early-returns in extractFn before site resolution.
    },
    {
      platform: defaultPlatformOptions,
      html: defaultHtmlOptions,
      headers: defaultHeadersOptions,
      guess: defaultGuessOptions,
    },
  )
}

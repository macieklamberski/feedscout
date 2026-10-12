import { createAcceptHeader, feedMimeTypes, genericFeedMimeTypes } from 'trousse'
import { defaultFetchFn, defaultResolveUrlFn } from '../common/discover/defaults.js'
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

const acceptHeader = createAcceptHeader([...feedMimeTypes, ...genericFeedMimeTypes])

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
      acceptHeader,
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

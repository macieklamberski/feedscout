import { createNativeFetchAdapter } from '../common/discover/adapters.js'
import { discover } from '../common/discover/index.js'
import type {
  DiscoverFetchFn,
  DiscoverInput,
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
import type { FeedResultValid } from './types.js'

export const discoverFeeds = async <TValid extends FeedResultValid = FeedResultValid>(
  input: DiscoverInput,
  options: DiscoverOptions<TValid>,
): Promise<Array<DiscoverResult<TValid>>> => {
  const fetchFn: DiscoverFetchFn = options.fetchFn ?? createNativeFetchAdapter()

  return discover<TValid>(
    input,
    {
      ...options,
      fetchFn,
      extractFn: options.extractFn ?? feedsmithExtractor,
      normalizeUrlFn: options.normalizeUrlFn ?? normalizeUrl,
    },
    {
      platform: defaultPlatformOptions,
      html: defaultHtmlOptions,
      headers: defaultHeadersOptions,
      guess: defaultGuessOptions,
    },
  )
}

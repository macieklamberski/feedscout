import { createNativeFetchAdapter } from '../common/discover/adapters.js'
import { discover } from '../common/discover/index.js'
import type { DiscoverInput, DiscoverOptions, DiscoverResult } from '../common/types.js'
import { normalizeUrl } from '../common/utils.js'
import { defaultGuessOptions, defaultHeadersOptions, defaultHtmlOptions } from './defaults.js'
import { createFeedsmithExtractor } from './extractors.js'
import type { FeedResultValid } from './types.js'

export const discoverFeeds = async <TValid extends FeedResultValid = FeedResultValid>(
  input: DiscoverInput,
  options: DiscoverOptions<TValid>,
): Promise<Array<DiscoverResult<TValid>>> => {
  return discover<TValid>(
    input,
    {
      ...options,
      fetchFn: options.fetchFn ?? createNativeFetchAdapter(),
      extractFn: options.extractFn ?? createFeedsmithExtractor(),
      normalizeUrlFn: options.normalizeUrlFn ?? normalizeUrl,
    },
    {
      html: defaultHtmlOptions,
      headers: defaultHeadersOptions,
      guess: defaultGuessOptions,
    },
  )
}

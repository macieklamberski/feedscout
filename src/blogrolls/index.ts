import { createNativeFetchAdapter } from '../common/discover/adapters.js'
import { discover } from '../common/discover/index.js'
import type { DiscoverInput, DiscoverOptions, DiscoverResult } from '../common/types.js'
import { normalizeUrl } from '../common/utils.js'
import { defaultGuessOptions, defaultHeadersOptions, defaultHtmlOptions } from './defaults.js'
import { feedsmithExtractor } from './extractors.js'
import type { BlogrollResultValid } from './types.js'

export const discoverBlogrolls = async <TValid extends BlogrollResultValid = BlogrollResultValid>(
  input: DiscoverInput,
  options: DiscoverOptions<TValid>,
): Promise<Array<DiscoverResult<TValid>>> => {
  return discover<TValid>(
    input,
    {
      ...options,
      fetchFn: options.fetchFn ?? createNativeFetchAdapter(),
      extractFn: options.extractFn ?? feedsmithExtractor,
      normalizeUrlFn: options.normalizeUrlFn ?? normalizeUrl,
    },
    {
      platform: { handlers: [] }, // Blogrolls do not use platform-specific discovery.
      html: defaultHtmlOptions,
      headers: defaultHeadersOptions,
      guess: defaultGuessOptions,
    },
  )
}

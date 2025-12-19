import { discover } from '../common/discover/index.js'
import { defaultFetchFn } from '../common/discover/utils.js'
import type { DiscoverInput, DiscoverOptions, DiscoverResult } from '../common/types.js'
import { normalizeUrl } from '../common/utils.js'
import { defaultGuessOptions, defaultHeadersOptions, defaultHtmlOptions } from './defaults.js'
import { defaultExtractor } from './extractors.js'
import type { BlogrollResult } from './types.js'

export const discoverBlogrolls = async <TValid extends BlogrollResult = BlogrollResult>(
  input: DiscoverInput,
  options: DiscoverOptions<TValid> = {},
): Promise<Array<DiscoverResult<TValid>>> => {
  return discover<TValid>(
    input,
    {
      ...options,
      methods: options.methods ?? ['html', 'headers', 'guess'],
      fetchFn: options.fetchFn ?? defaultFetchFn,
      extractFn: options.extractFn ?? defaultExtractor,
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

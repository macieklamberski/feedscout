import { discover } from '../common/discover/index.js'
import {
  defaultFetchFn,
  defaultResolveSiteUrlFn,
  defaultResolveUrlFn,
} from '../common/discover/utils.js'
import type { DiscoverInput, DiscoverOptions, DiscoverResult } from '../common/types.js'
import { defaultGuessOptions, defaultHeadersOptions, defaultHtmlOptions } from './defaults.js'
import { defaultExtractFn } from './extractors.js'
import type { BlogrollResult } from './types.js'

export const discoverBlogrolls = <TValid extends BlogrollResult = BlogrollResult>(
  input: DiscoverInput,
  options: DiscoverOptions<TValid, 'html' | 'headers' | 'guess'> = {},
): Promise<Array<DiscoverResult<TValid>>> => {
  return discover<TValid>(
    input,
    {
      ...options,
      methods: options.methods ?? ['html', 'headers', 'guess'],
      fetchFn: options.fetchFn ?? defaultFetchFn,
      extractFn: options.extractFn ?? defaultExtractFn,
      resolveUrlFn: options.resolveUrlFn ?? defaultResolveUrlFn,
      resolveSiteUrlFn: options.resolveSiteUrlFn ?? defaultResolveSiteUrlFn,
    },
    {
      html: defaultHtmlOptions,
      headers: defaultHeadersOptions,
      guess: defaultGuessOptions,
    },
  )
}

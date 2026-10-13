import {
  archiveExtensions,
  audioExtensions,
  codeExtensions,
  documentExtensions,
  flashExtensions,
  fontExtensions,
  imageExtensions,
  installerExtensions,
  subtitleExtensions,
  videoExtensions,
} from 'trousse'
import {
  defaultFetchFn,
  defaultResolveSiteUrlFn,
  defaultResolveUrlFn,
} from '../common/discover/defaults.js'
import { discover } from '../common/discover/index.js'
import type { DiscoverInput, DiscoverOptions, DiscoverResult } from '../common/types.js'
import { defaultGuessOptions, defaultHeadersOptions, defaultHtmlOptions } from './defaults.js'
import { defaultExtractFn } from './extractors.js'
import type { BlogrollResult } from './types.js'

const acceptHeader =
  'text/x-opml, text/x-opml+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.1'

const ignoredExtensions = [
  ...archiveExtensions,
  ...audioExtensions,
  ...codeExtensions,
  ...documentExtensions,
  ...flashExtensions,
  ...fontExtensions,
  ...imageExtensions,
  ...installerExtensions,
  ...subtitleExtensions,
  ...videoExtensions,
]

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
      ignoredExtensions,
      acceptHeader,
    },
    {
      html: defaultHtmlOptions,
      headers: defaultHeadersOptions,
      guess: defaultGuessOptions,
    },
  )
}

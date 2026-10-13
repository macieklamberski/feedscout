import {
  archiveExtensions,
  audioExtensions,
  codeExtensions,
  documentExtensions,
  flashExtensions,
  fontExtensions,
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

const acceptHeader =
  'image/avif, image/webp, image/png, image/svg+xml, image/x-icon, image/*;q=0.8, */*;q=0.1'

const ignoredExtensions = [
  ...archiveExtensions,
  ...audioExtensions,
  ...codeExtensions,
  ...documentExtensions,
  ...flashExtensions,
  ...fontExtensions,
  ...installerExtensions,
  ...subtitleExtensions,
  ...videoExtensions,
]

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
      ignoredExtensions,
      acceptHeader,
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

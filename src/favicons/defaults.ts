import type { LinkSelector } from '../common/types.js'
import type { GuessMethodOptions } from '../common/uris/guess/types.js'
import type { HeadersMethodOptions } from '../common/uris/headers/types.js'
import type { HtmlMethodOptions } from '../common/uris/html/types.js'
import type { PlatformMethodOptions } from '../common/uris/platform/types.js'
import { githubHandler } from './platform/handlers/github.js'

export const defaultIconRels = [
  'icon',
  'shortcut',
  'apple-touch-icon',
  'apple-touch-icon-precomposed',
]

export const defaultGuessPaths = [
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/favicon.png',
  '/favicon.svg',
]

export const linkSelectors: Array<LinkSelector> = defaultIconRels.map((rel) => ({ rel }))

export const defaultHtmlOptions: Omit<HtmlMethodOptions, 'baseUrl'> = {
  linkSelectors,
  anchorUris: [],
  anchorIgnoredUris: [],
  anchorLabels: [],
}

export const defaultHeadersOptions: Omit<HeadersMethodOptions, 'baseUrl'> = {
  linkSelectors,
}

export const defaultGuessOptions: Omit<GuessMethodOptions, 'baseUrl'> = {
  uris: defaultGuessPaths,
}

export const defaultPlatformOptions: Omit<PlatformMethodOptions, 'baseUrl'> = {
  handlers: [githubHandler],
}

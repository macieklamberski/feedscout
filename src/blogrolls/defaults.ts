import type { LinkSelector } from '../common/types.js'
import type { GuessMethodOptions } from '../common/uris/guess/types.js'
import type { HeadersMethodOptions } from '../common/uris/headers/types.js'
import type { HtmlMethodOptions } from '../common/uris/html/types.js'

export const opmlMimeTypes = ['text/x-opml', 'application/xml', 'text/xml']

export const blogrollUrisMinimal = [
  '/.well-known/recommendations.opml',
  '/blogroll.opml',
  '/opml.xml',
]

export const blogrollUrisBalanced = [
  ...blogrollUrisMinimal,
  '/blogroll.xml',
  '/subscriptions.opml',
  '/recommendations.opml',
]

export const blogrollUrisComprehensive = [
  ...blogrollUrisBalanced,
  '/links.opml',
  '/feeds.opml',
  '/subscriptions.xml',
]

export const anchorLabels = ['blogroll', 'opml', 'subscriptions', 'reading list']

export const linkSelectors: Array<LinkSelector> = [
  { rel: 'blogroll' },
  { rel: 'outline', types: opmlMimeTypes },
]

export const defaultHtmlOptions: Omit<HtmlMethodOptions, 'baseUrl'> = {
  linkSelectors,
  anchorUris: blogrollUrisComprehensive,
  anchorIgnoredUris: [],
  anchorLabels,
}

export const defaultHeadersOptions: Omit<HeadersMethodOptions, 'baseUrl'> = {
  linkSelectors,
}

export const defaultGuessOptions: Omit<GuessMethodOptions, 'baseUrl'> = {
  uris: blogrollUrisBalanced,
}

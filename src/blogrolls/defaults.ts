import type { LinkSelector } from '../common/types.js'
import type { GuessMethodOptions } from '../common/uris/guess/types.js'
import type { HeadersMethodOptions } from '../common/uris/headers/types.js'
import type { HtmlMethodOptions } from '../common/uris/html/types.js'

export const mimeTypes = ['text/x-opml', 'application/xml', 'text/xml']

export const urisMinimal = ['/.well-known/recommendations.opml', '/blogroll.opml', '/opml.xml']

export const urisBalanced = [
  ...urisMinimal,
  '/blogroll.xml',
  '/subscriptions.opml',
  '/recommendations.opml',
]

export const urisComprehensive = [
  ...urisBalanced,
  '/links.opml',
  '/feeds.opml',
  '/subscriptions.xml',
]

export const anchorLabels = ['blogroll', 'opml', 'subscriptions', 'reading list']

export const linkSelectors: Array<LinkSelector> = [
  { rel: 'blogroll' },
  { rel: 'outline', types: mimeTypes },
]

export const defaultHtmlOptions: Omit<HtmlMethodOptions, 'baseUrl'> = {
  linkSelectors,
  anchorUris: urisComprehensive,
  anchorIgnoredUris: [],
  anchorLabels,
}

export const defaultHeadersOptions: Omit<HeadersMethodOptions, 'baseUrl'> = {
  linkSelectors,
}

export const defaultGuessOptions: Omit<GuessMethodOptions, 'baseUrl'> = {
  uris: urisBalanced,
}

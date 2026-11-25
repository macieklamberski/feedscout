import type { LinkSelector } from '../common/types.js'
import type { GuessMethodOptions } from '../common/uris/guess/types.js'
import type { HeadersMethodOptions } from '../common/uris/headers/types.js'
import type { HtmlMethodOptions } from '../common/uris/html/types.js'

export const urisMinimal: ReadonlyArray<string> = [
  '/.well-known/recommendations.opml',
  '/blogroll.opml',
  '/opml.xml',
]

export const urisBalanced: ReadonlyArray<string> = [
  ...urisMinimal,
  '/blogroll.xml',
  '/subscriptions.opml',
  '/recommendations.opml',
]

export const urisComprehensive: ReadonlyArray<string> = [
  ...urisBalanced,
  '/links.opml',
  '/feeds.opml',
  '/subscriptions.xml',
]

export const anchorLabels: ReadonlyArray<string> = [
  'blogroll',
  'opml',
  'subscriptions',
  'reading list',
]

export const linkSelectors: ReadonlyArray<LinkSelector> = [
  { rel: 'blogroll' },
  { rel: 'outline', types: ['text/x-opml', 'application/opml+xml', 'application/xml', 'text/xml'] },
  { rel: 'alternate', types: ['text/x-opml', 'application/opml+xml'] },
]

export const defaultHtmlOptions: Omit<HtmlMethodOptions, 'baseUrl'> = {
  linkSelectors,
  anchorUris: urisComprehensive,
  anchorIgnoredUris: [],
  anchorLabels,
  anchorAttributes: ['aria-label', 'title'],
}

export const defaultHeadersOptions: Omit<HeadersMethodOptions, 'baseUrl'> = {
  linkSelectors,
}

export const defaultGuessOptions: Omit<GuessMethodOptions, 'baseUrl'> = {
  uris: urisBalanced,
}

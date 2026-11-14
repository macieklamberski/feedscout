import { decodeSegment, getPathSegments, getQueryParam, isAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SquarespaceUrl =
  | { kind: 'collection'; collection: string }
  | { kind: 'category'; collection: string; category: string }
  | { kind: 'tag'; collection: string; tag: string }

const domains = ['squarespace.com']

const squarespaceRegex = /squarespace/i

// A site on its own domain is known only by its marker, so only a feed on a squarespace.com site
// is claimed. A Squarespace 5 site serves the `.xml` feeds, redirects them from https to http with
// a jsessionid, and answers `?format=rss` with a page.
const feeds = definePlatformFeeds(
  [
    { key: 'squarespace:collection', template: '{scheme}://{host}/{collection}?format=rss' },
    { key: 'squarespace:collection', template: '{scheme}://{host}/?format=rss' },
    {
      key: 'squarespace:collection',
      template: '{scheme}://{host}/{parent}/{collection}?format=rss',
    },
    // One fixed value every site answers with the same feed as `format=rss`. Any other value after
    // `sqsp_rss_` answers the page.
    {
      key: 'squarespace:collection',
      template: '{scheme}://{host}/{collection}?format=sqsp_rss_wceoq1kgqnmf2cn9czutlluofr44tazt',
    },
    {
      key: 'squarespace:collection',
      template: '{scheme}://{host}/?format=sqsp_rss_wceoq1kgqnmf2cn9czutlluofr44tazt',
    },
    { key: 'squarespace:collection', template: '{scheme}://{host}/{collection}/rss.xml' },
    {
      key: 'squarespace:collection',
      template: '{scheme}://{host}/{collection}/rss.xml;jsessionid={session}',
    },
    {
      key: 'squarespace:collection',
      template: '{scheme}://{host}/{collection}/atom.xml',
      format: 'atom',
    },
    {
      key: 'squarespace:collection',
      template: '{scheme}://{host}/{collection}/atom.xml;jsessionid={session}',
      format: 'atom',
    },
    {
      key: 'squarespace:collection',
      template: '{scheme}://{host}/{collection}/rdf.xml',
      format: 'rdf',
    },
    {
      key: 'squarespace:collection',
      template: '{scheme}://{host}/{collection}/rdf.xml;jsessionid={session}',
      format: 'rdf',
    },
    {
      key: 'squarespace:category',
      template: '{scheme}://{host}/{collection}?category={category}&format=rss',
    },
    { key: 'squarespace:category', template: '{scheme}://{host}/?category={category}&format=rss' },
    {
      key: 'squarespace:category',
      template: '{scheme}://{host}/{collection}/category/{category}?format=rss',
    },
    {
      key: 'squarespace:category',
      template: '{scheme}://{host}/{collection}/rss.xml?categoryId={categoryId}',
    },
    {
      key: 'squarespace:category',
      template:
        '{scheme}://{host}/{collection}/rss.xml;jsessionid={session}?categoryId={categoryId}',
    },
    {
      key: 'squarespace:category',
      template: '{scheme}://{host}/{collection}/atom.xml?categoryId={categoryId}',
      format: 'atom',
    },
    {
      key: 'squarespace:category',
      template:
        '{scheme}://{host}/{collection}/atom.xml;jsessionid={session}?categoryId={categoryId}',
      format: 'atom',
    },
    {
      key: 'squarespace:category',
      template: '{scheme}://{host}/{collection}/rdf.xml?categoryId={categoryId}',
      format: 'rdf',
    },
    {
      key: 'squarespace:category',
      template:
        '{scheme}://{host}/{collection}/rdf.xml;jsessionid={session}?categoryId={categoryId}',
      format: 'rdf',
    },
    { key: 'squarespace:tag', template: '{scheme}://{host}/{collection}?tag={tag}&format=rss' },
    { key: 'squarespace:tag', template: '{scheme}://{host}/?tag={tag}&format=rss' },
    { key: 'squarespace:tag', template: '{scheme}://{host}/{collection}/tag/{tag}?format=rss' },
    { key: 'squarespace:comments', template: '{scheme}://{host}/{collection}/rss-comments.xml' },
    {
      key: 'squarespace:comments',
      template: '{scheme}://{host}/{collection}/rss-comments.xml;jsessionid={session}',
    },
  ],
  { domains },
)

export const isSquarespaceHeaders = (headers: Headers): boolean => {
  return squarespaceRegex.test(headers.get('server') ?? '')
}

// A category or tag page filters its collection, by path or by query.
export const parseSquarespaceUrl = (url: string): SquarespaceUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const [collection, route, value] = getPathSegments(parsedUrl)

  if (!collection) {
    return
  }

  // A path value reads as a query value does, `+` as a space, since the feed names it in the query:
  // `/category/Bible%20Talks` and `/category/Bible+Talks` both list `Bible Talks`.
  const pathValue = decodeSegment(value?.replaceAll('+', ' '))
  const category = isAnyOf(route, 'category') ? pathValue : getQueryParam(parsedUrl, 'category')

  if (category) {
    return { kind: 'category', collection, category }
  }

  const tag = isAnyOf(route, 'tag') ? pathValue : getQueryParam(parsedUrl, 'tag')

  if (tag) {
    return { kind: 'tag', collection, tag }
  }

  return { kind: 'collection', collection }
}

export const squarespaceHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isSquarespaceHeaders })) {
      return false
    }

    return parseSquarespaceUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSquarespaceUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'category') {
      const params = { collection: parsed.collection, category: parsed.category }

      return [
        page.getFeedEntry('squarespace:category', params),
        page.getFeedEntry('squarespace:collection', { collection: parsed.collection }),
      ]
    }

    if (parsed.kind === 'tag') {
      const params = { collection: parsed.collection, tag: parsed.tag }

      return [
        page.getFeedEntry('squarespace:tag', params),
        page.getFeedEntry('squarespace:collection', { collection: parsed.collection }),
      ]
    }

    return [page.getFeedEntry('squarespace:collection', { collection: parsed.collection })]
  },

  getFeedHint: feeds.getFeedHint,
}

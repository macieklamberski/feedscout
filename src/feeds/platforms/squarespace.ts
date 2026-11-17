import {
  decodeSegment,
  getPathSegments,
  getQueryParam,
  includesAnyOf,
  isAnyOf,
  parseUrl,
} from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SquarespaceUrl =
  | { kind: 'collection'; collection: string }
  | { kind: 'category'; collection: string; category: string }
  | { kind: 'tag'; collection: string; tag: string }

const domains = ['squarespace.com']

// A site on its own domain is known only by its marker, so only a feed on a squarespace.com site
// is claimed. A Squarespace 5 site serves the `.xml` feeds, redirects them from https to http with
// a jsessionid, and answers `?format=rss` with a page.
const feeds = definePlatformFeeds(
  'squarespace',
  [
    {
      key: 'collection',
      main: '{scheme}://{host}/{collection}?format=rss',
      aliases: [
        // One fixed value every site answers with the same feed as `format=rss`. Any other value
        // after `sqsp_rss_` answers the page.
        '{scheme}://{host}/{collection}?format=sqsp_rss_wceoq1kgqnmf2cn9czutlluofr44tazt',
        '{scheme}://{host}/{collection}/rss.xml',
        '{scheme}://{host}/{collection}/rss.xml;jsessionid={session}',
      ],
    },
    {
      key: 'collection',
      main: '{scheme}://{host}/?format=rss',
      aliases: ['{scheme}://{host}/?format=sqsp_rss_wceoq1kgqnmf2cn9czutlluofr44tazt'],
    },
    { key: 'collection', main: '{scheme}://{host}/{parent}/{collection}?format=rss' },
    {
      key: 'collection',
      main: '{scheme}://{host}/{collection}/atom.xml',
      format: 'atom',
      aliases: ['{scheme}://{host}/{collection}/atom.xml;jsessionid={session}'],
    },
    {
      key: 'collection',
      main: '{scheme}://{host}/{collection}/rdf.xml',
      format: 'rdf',
      aliases: ['{scheme}://{host}/{collection}/rdf.xml;jsessionid={session}'],
    },
    {
      key: 'category',
      main: '{scheme}://{host}/{collection}?category={category}&format=rss',
      aliases: ['{scheme}://{host}/{collection}/category/{category}?format=rss'],
    },
    { key: 'category', main: '{scheme}://{host}/?category={category}&format=rss' },
    {
      key: 'category',
      main: '{scheme}://{host}/{collection}/rss.xml?categoryId={categoryId}',
      aliases: [
        '{scheme}://{host}/{collection}/rss.xml;jsessionid={session}?categoryId={categoryId}',
      ],
    },
    {
      key: 'category',
      main: '{scheme}://{host}/{collection}/atom.xml?categoryId={categoryId}',
      format: 'atom',
      aliases: [
        '{scheme}://{host}/{collection}/atom.xml;jsessionid={session}?categoryId={categoryId}',
      ],
    },
    {
      key: 'category',
      main: '{scheme}://{host}/{collection}/rdf.xml?categoryId={categoryId}',
      format: 'rdf',
      aliases: [
        '{scheme}://{host}/{collection}/rdf.xml;jsessionid={session}?categoryId={categoryId}',
      ],
    },
    {
      key: 'tag',
      main: '{scheme}://{host}/{collection}?tag={tag}&format=rss',
      aliases: ['{scheme}://{host}/{collection}/tag/{tag}?format=rss'],
    },
    { key: 'tag', main: '{scheme}://{host}/?tag={tag}&format=rss' },
    {
      key: 'comments',
      main: '{scheme}://{host}/{collection}/rss-comments.xml',
      aliases: ['{scheme}://{host}/{collection}/rss-comments.xml;jsessionid={session}'],
    },
  ],
  { hosts: { tenants: domains } },
)

export const isSquarespaceHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('server'), 'squarespace')
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
        page.getFeedEntry('category', params),
        page.getFeedEntry('collection', { collection: parsed.collection }),
      ]
    }

    if (parsed.kind === 'tag') {
      const params = { collection: parsed.collection, tag: parsed.tag }

      return [
        page.getFeedEntry('tag', params),
        page.getFeedEntry('collection', { collection: parsed.collection }),
      ]
    }

    return [page.getFeedEntry('collection', { collection: parsed.collection })]
  },

  getFeedHint: feeds.getFeedHint,
}

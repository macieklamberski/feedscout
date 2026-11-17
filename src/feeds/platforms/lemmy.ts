import { getAnyOf, getPathSegments, getQueryParam, includesAnyOf, isAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasClass, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: community, local, user.
// Handler needed for: all.

type LemmyQuery = { sort?: string; limit?: string }

export type LemmyUrl =
  | ({ kind: 'community'; community: string } & LemmyQuery)
  | ({ kind: 'user'; username: string } & LemmyQuery)
  | ({ kind: 'home' } & LemmyQuery)

export type LemmyPage = LemmyUrl

const validSorts = [
  'Active',
  'Hot',
  'New',
  'Old',
  'TopHour',
  'TopSixHour',
  'TopTwelveHour',
  'TopDay',
  'TopWeek',
  'TopMonth',
  'TopThreeMonths',
  'TopSixMonths',
  'TopNineMonths',
  'TopYear',
  'TopAll',
  'Controversial',
  'Scaled',
  'MostComments',
  'NewComments',
]

// Lemmy is self-hosted, so nothing in a feed URL names it and the table only builds. A sort and a
// limit from the page carry into the feed, and the row with the most of them filled is built.
const feeds = definePlatformFeeds([
  { key: 'lemmy:community', main: '{root}/feeds/c/{community}.xml?sort={sort}&limit={limit}' },
  { key: 'lemmy:community', main: '{root}/feeds/c/{community}.xml?sort={sort}' },
  { key: 'lemmy:community', main: '{root}/feeds/c/{community}.xml?limit={limit}' },
  { key: 'lemmy:community', main: '{root}/feeds/c/{community}.xml' },
  { key: 'lemmy:user', main: '{root}/feeds/u/{username}.xml?sort={sort}&limit={limit}' },
  { key: 'lemmy:user', main: '{root}/feeds/u/{username}.xml?sort={sort}' },
  { key: 'lemmy:user', main: '{root}/feeds/u/{username}.xml?limit={limit}' },
  { key: 'lemmy:user', main: '{root}/feeds/u/{username}.xml' },
  { key: 'lemmy:all', main: '{root}/feeds/all.xml?sort={sort}&limit={limit}' },
  { key: 'lemmy:all', main: '{root}/feeds/all.xml?sort={sort}' },
  { key: 'lemmy:all', main: '{root}/feeds/all.xml?limit={limit}' },
  { key: 'lemmy:all', main: '{root}/feeds/all.xml' },
  { key: 'lemmy:local', main: '{root}/feeds/local.xml?sort={sort}&limit={limit}' },
  { key: 'lemmy:local', main: '{root}/feeds/local.xml?sort={sort}' },
  { key: 'lemmy:local', main: '{root}/feeds/local.xml?limit={limit}' },
  { key: 'lemmy:local', main: '{root}/feeds/local.xml' },
])

export const parseLemmyUrl = (url: string): LemmyUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const [section, name] = getPathSegments(parsedUrl)
  const { searchParams } = parsedUrl
  const sort = getQueryParam(searchParams, 'sort')
  const limit = getQueryParam(searchParams, 'limit')

  if (name && isAnyOf(section, 'c')) {
    return { kind: 'community', community: name, sort, limit }
  }

  if (name && isAnyOf(section, 'u')) {
    return { kind: 'user', username: name, sort, limit }
  }

  return { kind: 'home', sort, limit }
}

export const getLemmyPage = (url: string, content: string | undefined): LemmyPage | undefined => {
  const parsed = parseLemmyUrl(url)

  if (!parsed) {
    return
  }

  // The page advertises its feeds with the instance's default sort, which a feed URL without a sort
  // does not follow.
  const link = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'alternate'
  })
  const feedUrl = parseUrl(link?.attribs.href, 'https://example.com')
  const sort =
    getAnyOf(parsed.sort, validSorts) ??
    getAnyOf(getQueryParam(feedUrl?.searchParams, 'sort'), validSorts)

  return { ...parsed, sort }
}

// Current Lemmy serves no generator meta.
export const isLemmyHtml = (content: string): boolean => {
  return (
    findElement(content, (element) => hasClass(element, 'lemmy-site')) !== undefined ||
    hasMetaContent(content, 'generator', 'Lemmy')
  )
}

export const isLemmyHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('x-powered-by'), 'lemmy')
}

export const lemmyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!parseLemmyUrl(url)) {
      return false
    }

    return hasMarker(content, headers, { html: isLemmyHtml, headers: isLemmyHeaders })
  },

  resolve: (url, content) => {
    const page = getLemmyPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const { sort, limit } = page

    if (page.kind === 'community') {
      return [pageFeeds.getFeedEntry('lemmy:community', { community: page.community, sort, limit })]
    }

    if (page.kind === 'user') {
      return [pageFeeds.getFeedEntry('lemmy:user', { username: page.username, sort, limit })]
    }

    return [
      pageFeeds.getFeedEntry('lemmy:all', { sort, limit }),
      pageFeeds.getFeedEntry('lemmy:local', { sort, limit }),
    ]
  },
}

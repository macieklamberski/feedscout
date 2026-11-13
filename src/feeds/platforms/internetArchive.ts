import { getQueryParam, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const hosts = ['archive.org', 'www.archive.org']

const detailsRegex = /^\/details\/([^/@][^/]*)\/?$/i
const searchRegex = /^\/search\/?$/i

const feeds = definePlatformFeeds([
  {
    key: 'internet-archive:collection',
    template: 'https://archive.org/services/collection-rss.php?collection={collection}',
  },
  {
    key: 'internet-archive:search',
    template: 'https://archive.org/services/collection-rss.php?query={query}',
  },
  {
    key: 'internet-archive:collection',
    template: 'https://cors.archive.org/services/collection-rss.php?collection={collection}',
  },
  {
    key: 'internet-archive:search',
    template: 'https://cors.archive.org/services/collection-rss.php?query={query}',
  },
  // Claimed only: the advanced search serves the same items as the search feed, and the media
  // type, forum and bookmarks feeds name values no page here gives.
  {
    key: 'internet-archive:search',
    template: 'https://archive.org/advancedsearch.php?output=rss&q={query}',
  },
  {
    key: 'internet-archive:mediatype',
    template: 'https://archive.org/services/collection-rss.php?mediatype={mediatype}',
  },
  {
    key: 'internet-archive:mediatype',
    template: 'https://cors.archive.org/services/collection-rss.php?mediatype={mediatype}',
  },
  {
    key: 'internet-archive:forum',
    template: 'https://archive.org/iathreads/posts-display-new.php?forum={forum}&mode=rss',
  },
  {
    key: 'internet-archive:forum',
    template: 'https://cors.archive.org/iathreads/posts-display-new.php?forum={forum}&mode=rss',
  },
  {
    key: 'internet-archive:bookmarks',
    template: 'https://archive.org/bookmarks/{user}?output=rss',
  },
])

export type InternetArchivePage =
  | { kind: 'collection'; collection: string }
  | { kind: 'search'; query: string }

const getInternetArchivePage = (
  url: string,
  content: string | undefined,
): InternetArchivePage | undefined => {
  const { pathname, searchParams } = new URL(url)

  // Collections, accounts and search serve one app shell loading `/offshoot_assets/`, while
  // items serve full HTML without it. Accounts are `/details/@{user}`, which the path excludes.
  if (content?.includes('/offshoot_assets/')) {
    const collection = pathname.match(detailsRegex)?.[1]

    if (collection) {
      return { kind: 'collection', collection }
    }
  }

  const query = getQueryParam(searchParams, 'query')

  // A `sin` search runs over full text, captions or captures, which the feed's query does not.
  if (!searchRegex.test(pathname) || !query || getQueryParam(searchParams, 'sin')) {
    return
  }

  return { kind: 'search', query }
}

export const internetArchiveHandler: PlatformHandler = {
  match: (url, content) => {
    if (!isHostOf(url, hosts)) {
      return false
    }

    return getInternetArchivePage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getInternetArchivePage(url, content)

    if (!page) {
      return []
    }

    if (page.kind === 'collection') {
      return [feeds.getFeedEntry('internet-archive:collection', { collection: page.collection })]
    }

    return [feeds.getFeedEntry('internet-archive:search', { query: page.query })]
  },

  getFeedHint: feeds.getFeedHint,
}

import { getQueryParam, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const hosts = ['archive.org', 'www.archive.org']

const detailsRegex = /^\/details\/([^/@][^/]*)\/?$/i
const accountRegex = /^\/details\/@([^/]+)/i
const searchRegex = /^\/search\/?$/i

const feeds = definePlatformFeeds([
  {
    key: 'internet-archive:collection',
    template: 'https://archive.org/services/collection-rss.php?collection={collection}',
  },
  {
    key: 'internet-archive:collection',
    template: 'https://cors.archive.org/services/collection-rss.php?collection={collection}',
    isAlias: true,
  },
  {
    key: 'internet-archive:search',
    template: 'https://archive.org/services/collection-rss.php?query={query}',
  },
  {
    key: 'internet-archive:search',
    template: 'https://cors.archive.org/services/collection-rss.php?query={query}',
    isAlias: true,
  },
  // Claimed only: the advanced search serves the same items as the search feed.
  {
    key: 'internet-archive:search',
    template: 'https://archive.org/advancedsearch.php?output=rss&q={query}',
    isAlias: true,
  },
  // A collection's forum is named by the collection identifier, so `resolve` builds it on the
  // collection page.
  {
    key: 'internet-archive:forum',
    template: 'https://archive.org/iathreads/posts-display-new.php?forum={forum}&mode=rss',
  },
  {
    key: 'internet-archive:forum',
    template: 'https://cors.archive.org/iathreads/posts-display-new.php?forum={forum}&mode=rss',
    isAlias: true,
  },
  // Claimed only: the media type feed names a value no page here gives.
  {
    key: 'internet-archive:mediatype',
    template: 'https://archive.org/services/collection-rss.php?mediatype={mediatype}',
  },
  {
    key: 'internet-archive:mediatype',
    template: 'https://cors.archive.org/services/collection-rss.php?mediatype={mediatype}',
    isAlias: true,
  },
  // An account page names the account, and the feed answers where the account's screen name is
  // its handle.
  {
    key: 'internet-archive:bookmarks',
    template: 'https://archive.org/bookmarks/{user}?output=rss',
  },
])

export type InternetArchivePage =
  | { kind: 'collection'; collection: string }
  | { kind: 'search'; query: string }
  | { kind: 'account'; user: string }

const getInternetArchivePage = (
  url: string,
  content: string | undefined,
): InternetArchivePage | undefined => {
  const { pathname, searchParams } = new URL(url)

  // Collections, accounts and search serve one app shell loading `/offshoot_assets/`, while
  // items serve full HTML without it. Accounts are `/details/@{user}`.
  if (content?.includes('/offshoot_assets/')) {
    const collection = pathname.match(detailsRegex)?.[1]

    if (collection) {
      return { kind: 'collection', collection }
    }

    const user = pathname.match(accountRegex)?.[1]

    if (user) {
      return { kind: 'account', user }
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
      return [
        feeds.getFeedEntry('internet-archive:collection', { collection: page.collection }),
        feeds.getFeedEntry('internet-archive:forum', { forum: page.collection }),
      ]
    }

    if (page.kind === 'account') {
      return [feeds.getFeedEntry('internet-archive:bookmarks', { user: page.user })]
    }

    return [feeds.getFeedEntry('internet-archive:search', { query: page.query })]
  },

  getFeedHint: feeds.getFeedHint,
  getSiblingFeeds: feeds.getSiblingFeeds,
}

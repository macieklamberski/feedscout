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

  getFeedKey: feeds.getFeedKey,
}

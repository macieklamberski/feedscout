import { internetArchive } from 'feedintel'
import { getQueryParam, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: collection, forum, search.

const hosts = internetArchive.hosts.exact

const detailsRegex = /^\/details\/([^/@][^/]*)\/?$/i
const accountRegex = /^\/details\/@([^/]+)/i
const searchRegex = /^\/search\/?$/i

const feeds = withHintLabels(internetArchive.feeds)

export type InternetArchivePage =
  | { kind: 'collection'; collection: string }
  | { kind: 'search'; query: string }
  | { kind: 'account'; user: string }

const getInternetArchivePage = (
  url: string,
  content: string | undefined,
): InternetArchivePage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname, searchParams } = parsedUrl

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
        feeds.getFeedEntry('collection', { collection: page.collection }),
        feeds.getFeedEntry('forum', { forum: page.collection }),
      ]
    }

    if (page.kind === 'account') {
      return [feeds.getFeedEntry('bookmarks', { user: page.user })]
    }

    return [feeds.getFeedEntry('search', { query: page.query })]
  },

  getFeedHint: feeds.getFeedHint,
}

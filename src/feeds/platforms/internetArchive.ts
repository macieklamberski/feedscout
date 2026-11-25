import { internetArchive } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: collection, forum, search.

const feeds = withHintLabels(internetArchive.feeds)

export type InternetArchivePage =
  | { kind: 'collection'; collection: string }
  | { kind: 'search'; query: string }
  | { kind: 'account'; user: string }

const getInternetArchivePage = (
  url: string,
  content: string | undefined,
): InternetArchivePage | undefined => {
  const page = internetArchive.pages.readUrl(url)

  if (page?.key === 'search') {
    return { kind: 'search', query: page.values.query }
  }

  // Collections, accounts and search serve one app shell loading `/offshoot_assets/`, while
  // items serve full HTML without it.
  if (!content?.includes('/offshoot_assets/')) {
    return
  }

  if (page?.key === 'collection') {
    return { kind: 'collection', collection: page.values.collection }
  }

  if (page?.key === 'account') {
    return { kind: 'account', user: page.values.user }
  }
}

export const internetArchiveHandler: PlatformHandler = {
  match: (url, content) => {
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

import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const hosts = ['archive.org', 'www.archive.org']
const feedUrl = 'https://archive.org/services/collection-rss.php'

const detailsRegex = /^\/details\/([^/@][^/]*)\/?$/i
const searchRegex = /^\/search\/?$/i

// Collections, accounts and search serve one app shell loading `/offshoot_assets/`, while
// items serve full HTML without it. Accounts are `/details/@{user}`, which the path excludes.
const getCollection = (url: string, content: string | undefined): string | undefined => {
  if (!content?.includes('/offshoot_assets/')) {
    return
  }

  return new URL(url).pathname.match(detailsRegex)?.[1]
}

const getSearchQuery = (url: string): string | undefined => {
  const { pathname, searchParams } = new URL(url)
  const query = searchParams.get('query')

  // A `sin` search runs over full text, captions or captures, which the feed's query does not.
  if (!searchRegex.test(pathname) || !query || searchParams.get('sin')) {
    return
  }

  return query
}

export const internetArchiveHandler: PlatformHandler = {
  match: (url, content) => {
    if (!isHostOf(url, hosts)) {
      return false
    }

    return Boolean(getCollection(url, content) ?? getSearchQuery(url))
  },

  resolve: (url, content) => {
    const collection = getCollection(url, content)

    if (collection) {
      return [
        {
          uri: `${feedUrl}?${new URLSearchParams({ collection })}`,
          hint: composeHint('internet-archive:collection'),
        },
      ]
    }

    const query = getSearchQuery(url)

    if (query) {
      return [
        {
          uri: `${feedUrl}?${new URLSearchParams({ query })}`,
          hint: composeHint('internet-archive:search'),
        },
      ]
    }

    return []
  },
}

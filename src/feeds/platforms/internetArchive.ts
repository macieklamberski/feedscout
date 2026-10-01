import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const hosts = ['archive.org', 'www.archive.org']
const feedUrl = 'https://archive.org/services/collection-rss.php'

const detailsRegex = /^\/details\/([^/@][^/]*)\/?$/i
const searchRegex = /^\/search\/?$/i

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

  const query = searchParams.get('query')

  // A `sin` search runs over full text, captions or captures, which the feed's query does not.
  if (!searchRegex.test(pathname) || !query || searchParams.get('sin')) {
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
        {
          uri: `${feedUrl}?${new URLSearchParams({ collection: page.collection })}`,
          hint: composeHint('internet-archive:collection'),
        },
      ]
    }

    return [
      {
        uri: `${feedUrl}?${new URLSearchParams({ query: page.query })}`,
        hint: composeHint('internet-archive:search'),
      },
    ]
  },
}

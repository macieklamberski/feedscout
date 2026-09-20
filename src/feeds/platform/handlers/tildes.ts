import { isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Tildes exposes exactly four feed routes: `/topics.rss` and `/topics.atom`
// for the global home, plus `/~{group}/topics.{rss,atom}` per group, and HTML
// autodiscovery on `/` and `/~{group}` lists those feeds. The handler maps
// any in-app URL onto the canonical home or group feed pair and passes the
// `?tag=` query through so tag-filtered listings keep filtering on the feed
// (server forces `order=NEW` regardless).

const hosts = ['tildes.net', 'www.tildes.net']
const groupRegex = /^\/~([^/]+)/

export const tildesHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname, searchParams } = new URL(url)
    const groupMatch = pathname.match(groupRegex)
    const uris: Array<DiscoverUriEntry> = []

    // Tildes' feed views honour the ?tag= query (forces order=NEW server-side).
    const tag = searchParams.get('tag')
    const tagSuffix = tag ? `?tag=${encodeURIComponent(tag)}` : ''

    if (groupMatch?.[1]) {
      const group = groupMatch[1]

      uris.push({
        uri: `https://tildes.net/~${group}/topics.rss${tagSuffix}`,
        hint: composeHint('tildes:group-rss'),
      })
      uris.push({
        uri: `https://tildes.net/~${group}/topics.atom${tagSuffix}`,
        hint: composeHint('tildes:group-atom'),
      })

      return uris
    }

    // Global home feed only for root path.
    if (pathname === '/' || pathname === '') {
      uris.push({
        uri: `https://tildes.net/topics.rss${tagSuffix}`,
        hint: composeHint('tildes:topics-rss'),
      })
      uris.push({
        uri: `https://tildes.net/topics.atom${tagSuffix}`,
        hint: composeHint('tildes:topics-atom'),
      })
    }

    return uris
  },
}

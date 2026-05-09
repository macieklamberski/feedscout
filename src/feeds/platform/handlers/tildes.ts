import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverable without handler.

const hosts = ['tildes.net', 'www.tildes.net']
const groupRegex = /^\/~([^/]+)/

export const tildesHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const groupMatch = pathname.match(groupRegex)
    const uris: Array<DiscoverUriEntry> = []

    if (groupMatch?.[1]) {
      const group = groupMatch[1]

      uris.push({
        uri: `https://tildes.net/~${group}/topics.rss`,
        hint: composeHint('tildes:group-rss'),
      })
      uris.push({
        uri: `https://tildes.net/~${group}/topics.atom`,
        hint: composeHint('tildes:group-atom'),
      })

      return uris
    }

    // Global home feed only for root path.
    if (pathname === '/' || pathname === '') {
      uris.push({
        uri: 'https://tildes.net/topics.rss',
        hint: composeHint('tildes:topics-rss'),
      })
      uris.push({
        uri: 'https://tildes.net/topics.atom',
        hint: composeHint('tildes:topics-atom'),
      })
    }

    return uris
  },
}

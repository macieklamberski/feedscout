import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// PeerTube serves an instance feed at `/feeds/videos.xml` and narrows it with
// a query parameter: `?videoChannelName=` for a channel and `?accountName=`
// for an account.
//
// The channel name is taken from the path rather than an id, because that is
// what the URL carries. A channel federated from another instance is addressed
// as `handle@remote.host` and the bare handle answers 404.

const peertubeRegex = /peertube/i
const channelPathRegex = /^\/c\/([^/]+)/
const accountPathRegex = /^\/a\/([^/]+)/

export const isPeertubeHeaders = (headers: Headers): boolean => {
  return peertubeRegex.test(headers.get('x-powered-by') ?? '')
}

export const peertubeHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    return URL.canParse(url) && Boolean(headers && isPeertubeHeaders(headers))
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const channel = pathname.match(channelPathRegex)?.[1]
      const account = pathname.match(accountPathRegex)?.[1]
      const uris: Array<DiscoverUriEntry> = []

      if (channel) {
        uris.push({
          uri: `${origin}/feeds/videos.xml?videoChannelName=${channel}`,
          hint: composeHint('peertube:channel'),
        })
      }

      if (account) {
        uris.push({
          uri: `${origin}/feeds/videos.xml?accountName=${account}`,
          hint: composeHint('peertube:account'),
        })
      }

      uris.push({
        uri: `${origin}/feeds/videos.xml`,
        hint: composeHint('peertube:instance'),
      })

      return uris
    } catch {}

    return []
  },
}

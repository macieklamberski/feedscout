import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.

const peertubeRegex = /peertube/i
export const channelPathRegex = /^\/c\/([^/]+)/
export const accountPathRegex = /^\/a\/([^/]+)/

export const isPeertubeHeaders = (headers: Headers): boolean => {
  return peertubeRegex.test(headers.get('x-powered-by') ?? '')
}

export const peertubeHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    return Boolean(parseUrl(url)) && Boolean(headers && isPeertubeHeaders(headers))
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin, pathname } = parsedUrl
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
  },
}

import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PeertubeUrl = { kind: 'channel' | 'account'; name: string }

const peertubeRegex = /peertube/i
const channelPathRegex = /^\/c\/([^/]+)/
const accountPathRegex = /^\/a\/([^/]+)/

export const isPeertubeHeaders = (headers: Headers): boolean => {
  return peertubeRegex.test(headers.get('x-powered-by') ?? '')
}

export const parsePeertubeUrl = (url: string): PeertubeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl
  const channel = pathname.match(channelPathRegex)?.[1]

  if (channel) {
    return { kind: 'channel', name: channel }
  }

  const account = pathname.match(accountPathRegex)?.[1]

  if (account) {
    return { kind: 'account', name: account }
  }
}

export const peertubeHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    return Boolean(parseUrl(url)) && Boolean(headers && isPeertubeHeaders(headers))
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const parsed = parsePeertubeUrl(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed?.kind === 'channel') {
      uris.push({
        uri: `${origin}/feeds/videos.xml?videoChannelName=${parsed.name}`,
        hint: composeHint('peertube:channel'),
      })
    }

    if (parsed?.kind === 'account') {
      uris.push({
        uri: `${origin}/feeds/videos.xml?accountName=${parsed.name}`,
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

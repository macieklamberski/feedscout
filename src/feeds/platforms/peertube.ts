import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PeertubeUrl = { kind: 'channel' | 'account'; name: string } | { kind: 'instance' }

const peertubeRegex = /peertube/i
const channelPathRegex = /^\/c\/([^/]+)/i
const accountPathRegex = /^\/a\/([^/]+)/i

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

  return { kind: 'instance' }
}

export const peertubeHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isPeertubeHeaders })) {
      return false
    }

    return parsePeertubeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePeertubeUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const instance: DiscoverUriEntry = {
      uri: `${origin}/feeds/videos.xml`,
      hint: composeHint('peertube:instance'),
    }

    if (parsed.kind === 'channel') {
      return [
        {
          uri: `${origin}/feeds/videos.xml?videoChannelName=${parsed.name}`,
          hint: composeHint('peertube:channel'),
        },
        instance,
      ]
    }

    if (parsed.kind === 'account') {
      return [
        {
          uri: `${origin}/feeds/videos.xml?accountName=${parsed.name}`,
          hint: composeHint('peertube:account'),
        },
        instance,
      ]
    }

    return [instance]
  },
}

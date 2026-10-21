import { composeQuery, decodeSegment, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers channel, instance, legacyAccount, legacyChannel (html), partly covers account.

export type PeertubeUrl = { kind: 'channel' | 'account'; name: string } | { kind: 'instance' }

const peertubeRegex = /peertube/i
const channelPathRegex = /^\/(?:c|video-channels)\/([^/]+)/i
const accountPathRegex = /^\/(?:a|accounts)\/([^/]+)/i
const podcastFeedPath = '/feeds/podcast/videos.xml'

export const isPeertubeHeaders = (headers: Headers): boolean => {
  return peertubeRegex.test(headers.get('x-powered-by') ?? '')
}

// The podcast feed takes only the numeric channel id, which the channel page carries in its link
// to that feed. An instance too old to serve the feed links none.
const getPodcastChannelId = (url: string, content: string | undefined): string | undefined => {
  const { origin } = new URL(url)
  const link = findElement(content, (element) => {
    if (element.name !== 'link') {
      return false
    }

    const feedUrl = parseUrl(element.attribs.href ?? '', url)

    return (
      feedUrl?.origin === origin &&
      feedUrl.pathname === podcastFeedPath &&
      feedUrl.searchParams.has('videoChannelId')
    )
  })

  if (!link) {
    return
  }

  return parseUrl(link.attribs.href, url)?.searchParams.get('videoChannelId') ?? undefined
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

  resolve: (url, content) => {
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
      const query = composeQuery({ videoChannelName: decodeSegment(parsed.name) ?? parsed.name })
      const uris: Array<DiscoverUriEntry> = [
        {
          uri: `${origin}/feeds/videos.xml${query}`,
          hint: composeHint('peertube:channel'),
        },
      ]
      const channelId = getPodcastChannelId(url, content)

      if (channelId) {
        uris.push({
          uri: `${origin}${podcastFeedPath}${composeQuery({ videoChannelId: channelId })}`,
          hint: composeHint('peertube:channel-podcast'),
        })
      }

      uris.push(instance)

      return uris
    }

    if (parsed.kind === 'account') {
      const query = composeQuery({ accountName: decodeSegment(parsed.name) ?? parsed.name })

      return [
        {
          uri: `${origin}/feeds/videos.xml${query}`,
          hint: composeHint('peertube:account'),
        },
        instance,
      ]
    }

    return [instance]
  },
}

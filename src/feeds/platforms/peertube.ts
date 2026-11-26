import { peertube } from 'feedintel'
import { decodeSegment, getOrigin, getQueryParam, includesAnyOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: channel, channel-podcast, instance.
// Handler needed for: account.

export type PeertubeUrl = { kind: 'channel' | 'account'; name: string } | { kind: 'instance' }

const channelPathRegex = /^\/(?:c|video-channels)\/([^/]+)/i
const accountPathRegex = /^\/(?:a|accounts)\/([^/]+)/i

const podcastFeedPath = '/feeds/podcast/videos.xml'

const feeds = withHintLabels(peertube.feeds)

export const isPeertubeHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('x-powered-by'), 'peertube')
}

// The podcast feed takes only the numeric channel id, which the channel page carries in its link
// to that feed. An instance too old to serve the feed links none.
const getPodcastChannelId = (url: string, content: string | undefined): string | undefined => {
  const origin = getOrigin(url)

  if (!origin) {
    return
  }

  const link = findElement(content, (element) => {
    if (element.name !== 'link') {
      return false
    }

    const feedUrl = parseUrl(element.attribs.href, url)

    return (
      feedUrl?.origin === origin &&
      feedUrl.pathname === podcastFeedPath &&
      getQueryParam(feedUrl.searchParams, 'videoChannelId') !== undefined
    )
  })

  if (!link) {
    return
  }

  return getQueryParam(parseUrl(link.attribs.href, url)?.searchParams, 'videoChannelId')
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
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    if (parsed.kind === 'channel') {
      const params = {
        name: decodeSegment(parsed.name) ?? parsed.name,
        channelId: getPodcastChannelId(url, content),
      }

      if (!params.channelId) {
        return [pageFeeds.getFeedEntry('channel', params), pageFeeds.getFeedEntry('instance')]
      }

      return [
        pageFeeds.getFeedEntry('channel', params),
        pageFeeds.getFeedEntry('channel-podcast', params),
        pageFeeds.getFeedEntry('instance'),
      ]
    }

    if (parsed.kind === 'account') {
      return [
        pageFeeds.getFeedEntry('account', {
          name: decodeSegment(parsed.name) ?? parsed.name,
        }),
        pageFeeds.getFeedEntry('instance'),
      ]
    }

    return [pageFeeds.getFeedEntry('instance')]
  },
}

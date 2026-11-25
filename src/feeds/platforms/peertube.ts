import { peertube } from 'feedintel'
import { includesAnyOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker, isRootOfPage } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: channel, channel-podcast, instance.
// Handler needed for: account.

export type PeertubeUrl = { kind: 'channel' | 'account'; name: string } | { kind: 'instance' }

const feeds = withHintLabels(peertube.feeds)

export const isPeertubeHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('x-powered-by'), 'peertube')
}

// The podcast feed takes only the numeric channel id, which the channel page carries in its link
// to that feed. An instance too old to serve the feed links none.
const getPodcastChannelId = (url: string, content: string | undefined): string | undefined => {
  const origin = parseUrl(url)?.origin ?? ''
  const getLinkedChannelId = (href: string | undefined): string | undefined => {
    const feedUrl = parseUrl(href, url)?.href ?? ''

    if (!isRootOfPage(origin, feedUrl)) {
      return
    }

    const feed = peertube.feeds.readUrl(feedUrl, { isAnyHost: true })

    if (feed?.key !== 'channel-podcast') {
      return
    }

    return feed.values.channelId
  }
  const link = findElement(content, (element) => {
    return element.name === 'link' && getLinkedChannelId(element.attribs.href) !== undefined
  })

  return getLinkedChannelId(link?.attribs.href)
}

export const parsePeertubeUrl = (url: string): PeertubeUrl | undefined => {
  const page = peertube.pages.readUrl(url, { isAnyHost: true })

  if (!page) {
    return
  }

  if (page.key === 'channel') {
    return { kind: 'channel', name: page.values.name }
  }

  if (page.key === 'account') {
    return { kind: 'account', name: page.values.name }
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
    const pageFeeds = feeds.forSite(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    if (parsed.kind === 'channel') {
      const params = { name: parsed.name, channelId: getPodcastChannelId(url, content) }

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
        pageFeeds.getFeedEntry('account', { name: parsed.name }),
        pageFeeds.getFeedEntry('instance'),
      ]
    }

    return [pageFeeds.getFeedEntry('instance')]
  },
}

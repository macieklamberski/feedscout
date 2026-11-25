import { sermonNet } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: church.
// Handler needed for: channel, channel-audio-pdf, channel-media, channel-video.

export type SermonNetUrl = { kind: 'church' } | { kind: 'channel'; channel: string }
export type SermonNetPage =
  | { kind: 'church'; channels: Array<string> }
  | { kind: 'channel'; channel: string }

// The page links no feed. It embeds the channels and series of its media centre as JSON, and each
// one the church owns serves a feed.
const channelRegex = /"is_series":(?:false|true),"url":"([^"]+)"/g

const feeds = withHintLabels(sermonNet.feeds)

export const parseSermonNetUrl = (url: string): SermonNetUrl | undefined => {
  const page = sermonNet.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'channel') {
    return { kind: 'channel', channel: page.values.channel }
  }

  return { kind: 'church' }
}

export const getSermonNetPage = (
  url: string,
  content: string | undefined,
): SermonNetPage | undefined => {
  const parsed = parseSermonNetUrl(url)

  if (!parsed) {
    return
  }

  // Without the page only the URL names the channel, and the church feed is another channel on
  // some sites.
  if (parsed.kind === 'channel' && !content) {
    return parsed
  }

  const channels: Array<string> = []

  for (const [, channel] of content?.matchAll(channelRegex) ?? []) {
    if (channel && !channels.includes(channel)) {
      channels.push(channel)
    }
  }

  // A channel page lists its whole media centre, and its own feed is the one it names.
  if (parsed.kind === 'channel' && channels.includes(parsed.channel)) {
    return parsed
  }

  return { kind: 'church', channels }
}

export const sermonNetHandler: PlatformHandler = {
  match: (url) => {
    return parseSermonNetUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getSermonNetPage(url, content)
    const pageFeeds = feeds.forSite(url)

    if (!page || !pageFeeds) {
      return []
    }

    // The church's feed needs no value from the page, so every page builds it after its own feeds.
    if (page.kind === 'channel') {
      return [
        pageFeeds.getFeedEntry('channel', { channel: page.channel }),
        pageFeeds.getFeedEntry('channel-media', { channel: page.channel }),
        pageFeeds.getFeedEntry('channel-video', { channel: page.channel }),
        pageFeeds.getFeedEntry('channel-audio-pdf', { channel: page.channel }),
        pageFeeds.getFeedEntry('church'),
      ]
    }

    // The channel is page text, which can hold a `/`, and the table escapes it.
    return [
      ...page.channels.flatMap((channel) => {
        return [
          pageFeeds.getFeedEntry('channel', { channel }),
          pageFeeds.getFeedEntry('channel-media', { channel }),
          pageFeeds.getFeedEntry('channel-video', { channel }),
          pageFeeds.getFeedEntry('channel-audio-pdf', { channel }),
        ]
      }),
      pageFeeds.getFeedEntry('church'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}

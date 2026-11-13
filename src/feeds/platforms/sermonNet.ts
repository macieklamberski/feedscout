import { getPathSegments } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds, type PlatformFeedTable } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers church.
// Handler needed for: channel.

export type SermonNetUrl =
  | { kind: 'church'; tenant: string }
  | { kind: 'channel'; tenant: string; channel: string }
export type SermonNetPage =
  | { kind: 'church'; tenant: string; channels: Array<string> }
  | { kind: 'channel'; tenant: string; channel: string }

const domains = ['sermon.net']

// The page links no feed. It embeds the channels and series of its media centre as JSON, and each
// one the church owns serves a feed.
const channelRegex = /"is_series":(?:false|true),"url":"([^"]+)"/g

// A channel serves four feeds: its audio, all its media, its video, and its audio with its PDFs.
const feeds = definePlatformFeeds(
  [
    { key: 'sermon-net:channel', template: '{scheme}://{host}/rss/{channel}/audio' },
    { key: 'sermon-net:channel-media', template: '{scheme}://{host}/rss/{channel}' },
    { key: 'sermon-net:channel-video', template: '{scheme}://{host}/rss/{channel}/video' },
    { key: 'sermon-net:channel-audio-pdf', template: '{scheme}://{host}/rss/{channel}/audio_pdf' },
    { key: 'sermon-net:church', template: '{scheme}://{host}/rss' },
  ],
  { domains },
)

const getChannelFeeds = (
  pageFeeds: Pick<PlatformFeedTable, 'getFeedEntry'>,
  channel: string,
): Array<DiscoverUriEntry> => {
  return [
    pageFeeds.getFeedEntry('sermon-net:channel', { channel }),
    pageFeeds.getFeedEntry('sermon-net:channel-media', { channel }),
    pageFeeds.getFeedEntry('sermon-net:channel-video', { channel }),
    pageFeeds.getFeedEntry('sermon-net:channel-audio-pdf', { channel }),
  ]
}

export const parseSermonNetUrl = (url: string): SermonNetUrl | undefined => {
  const tenant = getTenantSubdomain(url, domains)

  if (!tenant) {
    return
  }

  // A channel page and its postings sit at `/{mediaCentre}/{channel}`.
  const [, channel] = getPathSegments(url)

  if (channel) {
    return { kind: 'channel', tenant, channel }
  }

  return { kind: 'church', tenant }
}

export const getSermonNetPage = (
  url: string,
  content: string | undefined,
): SermonNetPage | undefined => {
  const parsed = parseSermonNetUrl(url)

  if (!parsed) {
    return
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

  return { kind: 'church', tenant: parsed.tenant, channels }
}

export const sermonNetHandler: PlatformHandler = {
  match: (url) => {
    return parseSermonNetUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getSermonNetPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    if (page.kind === 'channel') {
      return [
        pageFeeds.getFeedEntry('sermon-net:channel', { channel: page.channel }),
        pageFeeds.getFeedEntry('sermon-net:channel-media', { channel: page.channel }),
        pageFeeds.getFeedEntry('sermon-net:channel-video', { channel: page.channel }),
        pageFeeds.getFeedEntry('sermon-net:channel-audio-pdf', { channel: page.channel }),
      ]
    }

    if (page.channels.length > 0) {
      // The channel is page text, which can hold a `/`, and the table escapes it.
      return page.channels.flatMap((channel) => {
        return getChannelFeeds(pageFeeds, channel)
      })
    }

    // A church whose media was removed lists no channel and still serves an empty feed here.
    return [pageFeeds.getFeedEntry('sermon-net:church')]
  },

  getFeedHint: feeds.getFeedHint,
}

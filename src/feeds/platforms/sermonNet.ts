import { encodePathSegment, getPathSegments } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers church.
// Handler needed for: channel.

export type SermonNetUrl = { kind: 'church' } | { kind: 'channel'; channel: string }
export type SermonNetPage =
  | { kind: 'church'; channels: Array<string> }
  | { kind: 'channel'; channel: string }

const domains = ['sermon.net']

// The page links no feed. It embeds the channels and series of its media centre as JSON, and each
// one the church owns serves a feed.
const channelRegex = /"is_series":(?:false|true),"url":"([^"]+)"/g

export const parseSermonNetUrl = (url: string): SermonNetUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  // A channel page and its postings sit at `/{mediaCentre}/{channel}`.
  const [, channel] = getPathSegments(url)

  if (channel) {
    return { kind: 'channel', channel }
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

    if (!page) {
      return []
    }

    const { origin } = new URL(url)

    if (page.kind === 'channel') {
      return [
        {
          uri: `${origin}/rss/${page.channel}/audio`,
          hint: composeHint('sermon-net:channel'),
        },
      ]
    }

    if (page.channels.length > 0) {
      return page.channels.map((channel) => {
        // The channel is page text, which can hold a `/`.
        const uri = `${origin}/rss/${encodePathSegment(channel)}/audio`

        return { uri, hint: composeHint('sermon-net:channel') }
      })
    }

    // A church whose media was removed lists no channel and still serves an empty feed here.
    return [
      {
        uri: `${origin}/rss`,
        hint: composeHint('sermon-net:church'),
      },
    ]
  },
}

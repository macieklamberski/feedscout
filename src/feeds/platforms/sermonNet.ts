import { getSubdomain, isAnyOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers church.
// Handler needed for: channel.

export type SermonNetUrl = { kind: 'church' } | { kind: 'channel'; channel: string }

const domains = ['sermon.net']

// The page links no feed. It embeds the channels and series of its media centre as JSON, and each
// one the church owns serves a feed.
const channelRegex = /"is_series":(?:false|true),"url":"([^"]+)"/g

// Sermon.net's own services, not churches.
const excludedSubdomains = ['api', 'www']

export const parseSermonNetUrl = (url: string): SermonNetUrl | undefined => {
  const church = getSubdomain(url, domains)

  if (!church || isAnyOf(church, excludedSubdomains)) {
    return
  }

  // A channel page and its postings sit at `/{mediaCentre}/{channel}`.
  const channel = new URL(url).pathname.split('/').filter(Boolean)[1]

  if (channel) {
    return { kind: 'channel', channel }
  }

  return { kind: 'church' }
}

export const sermonNetHandler: PlatformHandler = {
  match: (url) => {
    return parseSermonNetUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseSermonNetUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const channels = [...(content?.matchAll(channelRegex) ?? [])].map(([, channel]) => channel)

    // A channel page lists its whole media centre, and its own feed is the one it names.
    if (parsed.kind === 'channel' && channels.includes(parsed.channel)) {
      return [
        {
          uri: `${origin}/rss/${parsed.channel}/audio`,
          hint: composeHint('sermon-net:channel'),
        },
      ]
    }

    const uris: Array<DiscoverUriEntry> = []

    for (const channel of channels) {
      const uri = `${origin}/rss/${channel}/audio`

      if (uris.some((entry) => entry.uri === uri)) {
        continue
      }

      uris.push({ uri, hint: composeHint('sermon-net:channel') })
    }

    if (uris.length > 0) {
      return uris
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

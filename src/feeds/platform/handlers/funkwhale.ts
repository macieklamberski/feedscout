import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Funkwhale serves a per-channel RSS feed at `/api/v1/channels/{handle}/rss`.
//
// The v1 path is emitted rather than v2, which an instance advertises in its
// own link tag while a second instance answers 404 for it. v1 answered on both.
//
// An unknown channel answers 404 carrying an `<rss>` root and an RSS content
// type, so neither tells a live channel from a dead one.

const channelPathRegex = /^\/channels\/([^/]+)/

export const isFunkwhaleHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Funkwhale')
}

const getChannel = (url: string): string | undefined => {
  return new URL(url).pathname.match(channelPathRegex)?.[1]
}

export const funkwhaleHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isFunkwhaleHtml(content)) {
        return false
      }

      return Boolean(getChannel(url))
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)
      const channel = getChannel(url)

      if (!channel) {
        return []
      }

      return [
        {
          uri: `${origin}/api/v1/channels/${channel}/rss`,
          hint: composeHint('funkwhale:channel'),
        },
      ]
    } catch {}

    return []
  },
}

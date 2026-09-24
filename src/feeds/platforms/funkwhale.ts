import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const channelPathRegex = /^\/channels\/([^/]+)/

export const isFunkwhaleHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Funkwhale') || content.includes('id="fake-app"')
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

      // A remote channel, `{name}@{domain}`, has its feed on its own instance only.
      const [name, domain] = decodeURIComponent(channel).split('@')
      const channelUrl = domain
        ? `https://${domain}/api/v1/channels/${name}`
        : `${origin}/api/v1/channels/${channel}`

      return [
        {
          // v2 answers 404 on some instances that still serve v1.
          uri: `${channelUrl}/rss`,
          hint: composeHint('funkwhale:channel'),
        },
      ]
    } catch {}

    return []
  },
}

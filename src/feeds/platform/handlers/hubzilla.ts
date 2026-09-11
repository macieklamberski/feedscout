import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Hubzilla serves a per-channel Atom feed at `/feed/{channel}`.
//
// There is no site-wide feed, so a page outside a channel is not matched:
// there would be nothing to resolve.

const channelPathRegex = /^\/(?:channel|feed)\/([^/]+)/

export const isHubzillaHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'hubzilla')
}

const getChannel = (url: string): string | undefined => {
  return new URL(url).pathname.match(channelPathRegex)?.[1]
}

export const hubzillaHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isHubzillaHtml(content)) {
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

      return [{ uri: `${origin}/feed/${channel}`, hint: composeHint('hubzilla:channel') }]
    } catch {}

    return []
  },
}

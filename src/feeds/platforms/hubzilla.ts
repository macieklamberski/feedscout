import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const channelPathRegex = /^\/(?:(?:channel|feed|profile)\/|@)([^/]+)/i

// A custom theme can drop the generator, while core prints `var zid` in every page head.
export const isHubzillaHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'hubzilla') || content.includes('var zid =')
}

const getChannel = (url: string): string | undefined => {
  return new URL(url).pathname.match(channelPathRegex)?.[1]
}

export const hubzillaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isHubzillaHtml })) {
      return false
    }

    return Boolean(getChannel(url))
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const channel = getChannel(url)

    if (!channel) {
      return []
    }

    return [{ uri: `${origin}/feed/${channel}`, hint: composeHint('hubzilla:channel') }]
  },
}

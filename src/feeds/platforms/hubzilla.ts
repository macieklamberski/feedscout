import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HubzillaUrl = { kind: 'channel'; channel: string }

const channelPathRegex = /^\/(?:(?:channel|feed|profile)\/|@)([^/]+)/i

// A custom theme can drop the generator, while core prints `var zid` in every page head.
export const isHubzillaHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'hubzilla') || content.includes('var zid =')
}

export const parseHubzillaUrl = (url: string): HubzillaUrl | undefined => {
  const channel = new URL(url).pathname.match(channelPathRegex)?.[1]

  if (!channel) {
    return
  }

  return { kind: 'channel', channel }
}

export const hubzillaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isHubzillaHtml })) {
      return false
    }

    return parseHubzillaUrl(url) !== undefined
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const parsed = parseHubzillaUrl(url)

    if (!parsed) {
      return []
    }

    return [{ uri: `${origin}/feed/${parsed.channel}`, hint: composeHint('hubzilla:channel') }]
  },
}

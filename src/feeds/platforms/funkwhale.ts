import { decodeSegment, encodePathSegment } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  getHostOrigin,
  hasElementWithId,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type FunkwhaleUrl = { kind: 'channel'; channel: string }

const channelPathRegex = /^\/channels\/([^/]+)/i
// A remote channel can be written in the fediverse form, `@{name}@{domain}`.
const leadingAtRegex = /^@/

export const isFunkwhaleHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Funkwhale') || hasElementWithId(content, 'fake-app')
}

export const parseFunkwhaleUrl = (url: string): FunkwhaleUrl | undefined => {
  const channel = new URL(url).pathname.match(channelPathRegex)?.[1]

  if (!channel) {
    return
  }

  return { kind: 'channel', channel }
}

export const funkwhaleHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isFunkwhaleHtml })) {
      return false
    }

    return parseFunkwhaleUrl(url) !== undefined
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const parsed = parseFunkwhaleUrl(url)

    if (!parsed) {
      return []
    }

    const { channel } = parsed

    // A remote channel, `{name}@{domain}`, has its feed on its own instance only.
    const [name, domain] = (decodeSegment(channel) ?? channel)
      .replace(leadingAtRegex, '')
      .split('@')
    const channelOrigin = domain ? getHostOrigin(domain) : origin

    if (!channelOrigin) {
      return []
    }

    // The name comes out of the path decoded, and it goes back into one.
    const channelUrl = `${channelOrigin}/api/v1/channels/${domain ? encodePathSegment(name) : channel}`

    return [
      {
        // v2 answers 404 on some instances that still serve v1.
        uri: `${channelUrl}/rss`,
        hint: composeHint('funkwhale:channel'),
      },
    ]
  },
}

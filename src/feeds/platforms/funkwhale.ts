import { funkwhale } from 'feedintel'
import { decodeSegment, getOrigin, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin, hasElementWithId, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type FunkwhaleUrl = { kind: 'channel'; channel: string }

const channelPathRegex = /^\/channels\/([^/]+)/i
// A remote channel can be written in the fediverse form, `@{name}@{domain}`.
const leadingAtRegex = /^@/

const feeds = withHintLabels(funkwhale.feeds)

export const isFunkwhaleHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Funkwhale') || hasElementWithId(content, 'fake-app')
}

export const parseFunkwhaleUrl = (url: string): FunkwhaleUrl | undefined => {
  const channel = parseUrl(url)?.pathname.match(channelPathRegex)?.[1]

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
    const origin = getOrigin(url)

    if (!origin) {
      return []
    }

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

    // The name comes out of the path decoded, and the table encodes it back into one.
    return [
      feeds.getFeedEntry('channel', {
        root: channelOrigin,
        channel: domain ? name : channel,
      }),
    ]
  },
}

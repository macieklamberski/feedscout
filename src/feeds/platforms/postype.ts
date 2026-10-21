import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// A channel subdomain redirects to www.postype.com/@{channel}.
export type PostypeUrl =
  | { kind: 'channel'; channel: string }
  | { kind: 'subdomain'; channel: string }

const domains = ['postype.com']
export const hosts = ['postype.com', 'www.postype.com']

export const parsePostypeUrl = (url: string): PostypeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (isHostOf(parsedUrl, hosts)) {
    const [first] = getPathSegments(parsedUrl)

    // length: keeps a bare @ with no channel after it out
    if (!first?.startsWith('@') || first.length < 2) {
      return
    }

    return { kind: 'channel', channel: first.slice(1) }
  }

  const subdomain = getTenantSubdomain(parsedUrl, domains)

  if (!subdomain) {
    return
  }

  return { kind: 'subdomain', channel: subdomain }
}

export const postypeHandler: PlatformHandler = {
  match: (url) => {
    return parsePostypeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePostypeUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'channel') {
      return [
        {
          uri: `https://www.postype.com/@${parsed.channel}/rss`,
          hint: composeHint('postype:posts'),
        },
      ]
    }

    return [{ uri: `${new URL(url).origin}/rss`, hint: composeHint('postype:posts') }]
  },
}

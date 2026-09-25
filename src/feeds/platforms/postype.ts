import { getPathSegments, getSubdomain, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers profile (html).
// Handler needed for: subdomain.

// A channel subdomain redirects to www.postype.com/@{channel}.
export type PostypeUrl =
  | { kind: 'channel'; channel: string }
  | { kind: 'subdomain'; channel: string }

export const hosts = ['postype.com', 'www.postype.com']
const excludedSubdomains = ['www', 'api', 'cdn', 'i', 'blog-cdn']

export const parsePostypeUrl = (url: string): PostypeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (isHostOf(parsedUrl, hosts)) {
    const [first] = getPathSegments(parsedUrl)

    if (!first?.startsWith('@') || first.length < 2) {
      return
    }

    return { kind: 'channel', channel: first.slice(1) }
  }

  const subdomain = getSubdomain(parsedUrl, 'postype.com')

  // A nested subdomain like a.b.postype.com fails TLS, since the certificate covers one label.
  if (!subdomain || subdomain.includes('.')) {
    return
  }

  if (excludedSubdomains.includes(subdomain)) {
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

    if (parsed?.kind === 'channel') {
      return [
        {
          uri: `https://www.postype.com/@${parsed.channel}/rss`,
          hint: composeHint('postype:posts'),
        },
      ]
    }

    if (parsed?.kind === 'subdomain') {
      return [{ uri: `${new URL(url).origin}/rss`, hint: composeHint('postype:posts') }]
    }

    return []
  },
}

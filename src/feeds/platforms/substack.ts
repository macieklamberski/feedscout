import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html).
// Handler needed for: profile.

export type SubstackUrl = { kind: 'newsletter' } | { kind: 'profile'; username: string }

const domains = ['substack.com']
// The link shortener for shared posts and the help center.
const excludedSubdomains = ['open', 'support']
const profileRegex = /^\/@([\w-]+)/
// A profile page embeds its primary publication as escaped JSON. The publication
// subdomain is not always the handle, and a custom domain replaces it.
const publicationRegex =
  /primaryPublication\\?":\{[^}]*?\\?"subdomain\\?":\\?"([\w-]+)\\?",\\?"custom_domain\\?":(?:\\?"([^"\\]+)\\?"|null)/

const getPublicationOrigin = (content: string | undefined): string | undefined => {
  const match = content?.match(publicationRegex)

  if (!match?.[1]) {
    return
  }

  return match[2] ? `https://${match[2]}` : `https://${match[1]}.substack.com`
}

export const parseSubstackUrl = (url: string): SubstackUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (getTenantSubdomain(parsedUrl, domains, excludedSubdomains)) {
    return { kind: 'newsletter' }
  }

  if (!isHostOf(parsedUrl, domains)) {
    return
  }

  const username = parsedUrl.pathname.match(profileRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'profile', username }
}

export const substackHandler: PlatformHandler = {
  match: (url) => {
    return parseSubstackUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseSubstackUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'profile') {
      const origin = getPublicationOrigin(content) ?? `https://${parsed.username}.substack.com`

      return [{ uri: `${origin}/feed`, hint: composeHint('substack:newsletter') }]
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/feed`, hint: composeHint('substack:newsletter') }]
  },
}

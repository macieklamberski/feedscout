import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  getHostOrigin,
  getTenantSubdomain,
  wordOrHyphenRegex,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (guess, html).
// Handler needed for: profile.

export type SubstackUrl = { kind: 'newsletter' } | { kind: 'profile'; username: string }
export type SubstackPage = { kind: 'newsletter' | 'profile'; origin: string }

const domains = ['substack.com']
// The app host names a publication in the path, so it is no publication itself.
const appHosts = ['open.substack.com']
const profileRegex = /^\/@(?<username>[^/]+)/
// A profile page embeds its primary publication as escaped JSON. The publication
// subdomain is not always the handle, and a custom domain replaces it.
const publicationRegex =
  /primaryPublication\\?":\{[^{}]*?\\?"subdomain\\?":\\?"([\w-]+)\\?",\\?"custom_domain\\?":(?:\\?"([^"\\]+)\\?"|null)/

const getPublicationOrigin = (content: string | undefined): string | undefined => {
  const match = content?.match(publicationRegex)

  if (!match?.[1]) {
    return
  }

  const customOrigin = match[2] ? getHostOrigin(match[2]) : undefined

  return customOrigin ?? `https://${match[1]}.substack.com`
}

export const parseSubstackUrl = (url: string): SubstackUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (getTenantSubdomain(parsedUrl, domains) && !isHostOf(parsedUrl, appHosts)) {
    return { kind: 'newsletter' }
  }

  if (!isHostOf(parsedUrl, domains)) {
    return
  }

  const username = parsedUrl.pathname.match(profileRegex)?.groups?.username

  if (!username || !wordOrHyphenRegex.test(username)) {
    return
  }

  return { kind: 'profile', username }
}

export const getSubstackPage = (
  url: string,
  content: string | undefined,
): SubstackPage | undefined => {
  const parsed = parseSubstackUrl(url)

  if (!parsed) {
    return
  }

  if (parsed.kind === 'newsletter') {
    return { kind: 'newsletter', origin: new URL(url).origin }
  }

  const origin = getPublicationOrigin(content) ?? `https://${parsed.username}.substack.com`

  return { kind: 'profile', origin }
}

export const substackHandler: PlatformHandler = {
  match: (url) => {
    return parseSubstackUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getSubstackPage(url, content)

    if (!page) {
      return []
    }

    return [{ uri: `${page.origin}/feed`, hint: composeHint('substack:newsletter') }]
  },
}

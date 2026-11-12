import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin, getTenantSubdomain, wordOrHyphenRegex } from '../../common/utils.js'

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
  /primaryPublication\\?":\{[^{}]*?\\?"subdomain\\?":\\?"(?<subdomain>[\w-]+)\\?",\\?"custom_domain\\?":(?:\\?"(?<customDomain>[^"\\]+)\\?"|null)/

// A custom domain is read only from a profile page, so its feed is built here but not claimed.
// The same feed answers at feed.xml and feed.rss.
const feeds = definePlatformFeeds(
  [
    { key: 'substack:newsletter', template: '{scheme}://{host}/feed' },
    { key: 'substack:newsletter', template: '{scheme}://{host}/feed.xml' },
    { key: 'substack:newsletter', template: '{scheme}://{host}/feed.rss' },
  ],
  { domains },
)

const getPublicationOrigin = (content: string | undefined): string | undefined => {
  const { subdomain, customDomain } = content?.match(publicationRegex)?.groups ?? {}

  if (!subdomain) {
    return
  }

  const customOrigin = customDomain ? getHostOrigin(customDomain) : undefined

  return customOrigin ?? `https://${subdomain}.substack.com`
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

    const { protocol, host } = new URL(page.origin)

    return [feeds.getFeedEntry('substack:newsletter', { scheme: protocol.slice(0, -1), host })]
  },

  // The table reads any host under substack.com, so the page parser refuses the apex and the app
  // host first, whose /feed answers 404, and a nested subdomain, which fails its TLS handshake.
  getFeedHint: (url) => {
    if (!parseSubstackUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}

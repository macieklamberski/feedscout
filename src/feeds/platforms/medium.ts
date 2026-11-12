import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers customDomain, profile, publication, publicationTag, subdomainTag (guess, html).
// Handler needed for: tag.

export type MediumUrl =
  | { kind: 'user'; username: string }
  | { kind: 'tag'; tag: string }
  | { kind: 'publication'; publication: string; tag?: string }
  | { kind: 'subdomain'; subdomain: string; tag?: string }

const domains = ['medium.com']
export const hosts = ['medium.com', 'www.medium.com']

const userRegex = /^\/@([^/]+)/
const tagRegex = /^\/tag\/([^/]+)/i
const publicationTagRegex = /^\/([^/@][^/]+)\/tagged\/([^/]+)/i
const publicationRegex = /^\/([^/@][^/]+)/
const subdomainTagRegex = /^\/tagged\/([^/]+)/i

// The `@` row comes before the publication row, which would read `@{username}` as a publication.
const feeds = definePlatformFeeds([
  { key: 'medium:posts', template: 'https://medium.com/feed/@{username}' },
  { key: 'medium:tag', template: 'https://medium.com/feed/tag/{tag}' },
  { key: 'medium:tagged', template: 'https://medium.com/feed/{publication}/tagged/{tag}' },
  { key: 'medium:publication', template: 'https://medium.com/feed/{publication}' },
])

// A table builds the first row of a key, so the subdomain feeds under the same keys get their own.
const subdomainFeeds = definePlatformFeeds([
  { key: 'medium:tagged', template: 'https://{subdomain}.medium.com/feed/tagged/{tag}' },
  { key: 'medium:publication', template: 'https://{subdomain}.medium.com/feed' },
])

export const parseMediumUrl = (url: string): MediumUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl

  if (!isHostOf(parsedUrl, hosts)) {
    const subdomain = getTenantSubdomain(parsedUrl, domains)

    if (!subdomain) {
      return
    }

    const tag = pathname.match(subdomainTagRegex)?.[1]

    if (tag) {
      return { kind: 'subdomain', subdomain, tag }
    }

    return { kind: 'subdomain', subdomain }
  }

  const username = pathname.match(userRegex)?.[1]

  if (username) {
    return { kind: 'user', username }
  }

  const tag = pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  const publication = pathname.match(publicationRegex)?.[1]

  if (!publication) {
    return
  }

  const publicationTag = pathname.match(publicationTagRegex)?.[2]

  if (publicationTag) {
    return { kind: 'publication', publication, tag: publicationTag }
  }

  return { kind: 'publication', publication }
}

export const mediumHandler: PlatformHandler = {
  match: (url) => {
    return parseMediumUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMediumUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'user') {
      return [feeds.getFeedEntry('medium:posts', { username: parsed.username })]
    }

    if (parsed.kind === 'tag') {
      return [feeds.getFeedEntry('medium:tag', { tag: parsed.tag })]
    }

    if (parsed.kind === 'publication' && parsed.tag) {
      const params = { publication: parsed.publication, tag: parsed.tag }

      return [feeds.getFeedEntry('medium:tagged', params)]
    }

    if (parsed.kind === 'publication') {
      return [feeds.getFeedEntry('medium:publication', { publication: parsed.publication })]
    }

    // A user subdomain answers 404 at medium.com/feed/{subdomain}, and its own host serves
    // the feed.
    if (parsed.tag) {
      const params = { subdomain: parsed.subdomain, tag: parsed.tag }

      return [subdomainFeeds.getFeedEntry('medium:tagged', params)]
    }

    return [subdomainFeeds.getFeedEntry('medium:publication', { subdomain: parsed.subdomain })]
  },

  getFeedHint: (url) => {
    return feeds.getFeedHint(url) ?? subdomainFeeds.getFeedHint(url)
  },
}

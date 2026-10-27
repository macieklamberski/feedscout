import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

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
const publicationTagRegex = /^\/(?<publication>[^/@][^/]+)\/tagged\/(?<tag>[^/]+)/i
const publicationRegex = /^\/([^/@][^/]+)/
const subdomainTagRegex = /^\/tagged\/([^/]+)/i

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

  const publicationTag = pathname.match(publicationTagRegex)?.groups?.tag

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
      return [
        {
          uri: `https://medium.com/feed/@${parsed.username}`,
          hint: composeHint('medium:posts'),
        },
      ]
    }

    if (parsed.kind === 'tag') {
      return [{ uri: `https://medium.com/feed/tag/${parsed.tag}`, hint: composeHint('medium:tag') }]
    }

    if (parsed.kind === 'publication' && parsed.tag) {
      return [
        {
          uri: `https://medium.com/feed/${parsed.publication}/tagged/${parsed.tag}`,
          hint: composeHint('medium:tagged'),
        },
      ]
    }

    if (parsed.kind === 'publication') {
      return [
        {
          uri: `https://medium.com/feed/${parsed.publication}`,
          hint: composeHint('medium:publication'),
        },
      ]
    }

    // A user subdomain answers 404 at medium.com/feed/{subdomain}, and its own host serves
    // the feed.
    if (parsed.kind === 'subdomain' && parsed.tag) {
      return [
        {
          uri: `https://${parsed.subdomain}.medium.com/feed/tagged/${parsed.tag}`,
          hint: composeHint('medium:tagged'),
        },
      ]
    }

    return [
      {
        uri: `https://${parsed.subdomain}.medium.com/feed`,
        hint: composeHint('medium:publication'),
      },
    ]
  },
}

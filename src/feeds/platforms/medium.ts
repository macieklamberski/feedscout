import { medium } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: publication.
// Handler needed for: tag.

export type MediumUrl =
  | { kind: 'user'; username: string }
  | { kind: 'tag'; tag: string }
  | { kind: 'publication'; publication: string; tag?: string }
  | { kind: 'subdomain'; subdomain: string; tag?: string }

const domains = medium.hosts.tenants
export const hosts = medium.hosts.exact

const userRegex = /^\/@([^/]+)/
const tagRegex = /^\/tag\/([^/]+)/i
const publicationTagRegex = /^\/([^/@][^/]+)\/tagged\/([^/]+)/i
const publicationRegex = /^\/([^/@][^/]+)/
const subdomainTagRegex = /^\/tagged\/([^/]+)/i

const feeds = withHintLabels(medium.feeds)

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
      return [feeds.getFeedEntry('posts', { username: parsed.username })]
    }

    if (parsed.kind === 'tag') {
      return [feeds.getFeedEntry('tag', { tag: parsed.tag })]
    }

    if (parsed.kind === 'publication' && parsed.tag) {
      const params = { publication: parsed.publication, tag: parsed.tag }

      return [feeds.getFeedEntry('tagged', params)]
    }

    if (parsed.kind === 'publication') {
      return [feeds.getFeedEntry('publication', { publication: parsed.publication })]
    }

    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    if (parsed.tag) {
      return [page.getFeedEntry('tagged', { tag: parsed.tag })]
    }

    return [page.getFeedEntry('publication')]
  },

  getFeedHint: feeds.getFeedHint,
}

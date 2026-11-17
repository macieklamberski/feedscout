import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
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

const domains = ['medium.com']
export const hosts = ['medium.com', 'www.medium.com']

const userRegex = /^\/@([^/]+)/
const tagRegex = /^\/tag\/([^/]+)/i
const publicationTagRegex = /^\/([^/@][^/]+)\/tagged\/([^/]+)/i
const publicationRegex = /^\/([^/@][^/]+)/
const subdomainTagRegex = /^\/tagged\/([^/]+)/i

// The `@` row comes before the publication row, which would read `@{username}` as a publication.
// A user feed is also served at `/@{username}/feed`. A user subdomain serves its feeds on its own
// host, since medium.com/feed/{subdomain} answers 404.
const feeds = definePlatformFeeds(
  'medium',
  [
    {
      key: 'posts',
      main: 'https://medium.com/feed/@{username}',
      aliases: ['https://medium.com/@{username}/feed'],
    },
    { key: 'tag', main: 'https://medium.com/feed/tag/{tag}' },
    { key: 'tagged', main: 'https://medium.com/feed/{publication}/tagged/{tag}' },
    { key: 'tagged', main: '{scheme}://{host}/feed/tagged/{tag}' },
    { key: 'publication', main: 'https://medium.com/feed/{publication}' },
    { key: 'publication', main: '{scheme}://{host}/feed' },
  ],
  { hosts: { tenants: domains } },
)

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

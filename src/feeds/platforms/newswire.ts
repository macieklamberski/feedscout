import { getAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers newsroom (guess, html), partly covers beat, contentType.

export type NewswireUrl =
  | { kind: 'newsroom'; newsroom: string }
  | { kind: 'beat'; newsroom: string; beat: string }
  | { kind: 'contentType'; newsroom: string; contentType: NewswireContentType }

type NewswireContentType = (typeof contentTypes)[number]

const domains = ['newswire.com']

const beatPathRegex = /^\/browse\/beat\/([a-z0-9-]+)\/?$/i
const contentTypePathRegex = /^\/browse\/([^/]+)\/?$/i

const contentTypes = ['news', 'pr', 'social'] as const

const feeds = definePlatformFeeds([
  { key: 'newswire:beat', template: 'https://{newsroom}.newswire.com/browse/rss/beat/{beat}' },
  { key: 'newswire:news', template: 'https://{newsroom}.newswire.com/browse/rss/news' },
  { key: 'newswire:press-releases', template: 'https://{newsroom}.newswire.com/browse/rss/pr' },
  { key: 'newswire:social', template: 'https://{newsroom}.newswire.com/browse/rss/social' },
  { key: 'newswire:newsroom', template: 'https://{newsroom}.newswire.com/browse/rss' },
])

export const parseNewswireUrl = (url: string): NewswireUrl | undefined => {
  const pathname = parseUrl(url)?.pathname
  const newsroom = getTenantSubdomain(url, domains)

  if (!pathname || !newsroom) {
    return
  }

  const beat = pathname.match(beatPathRegex)?.[1]

  if (beat) {
    return { kind: 'beat', newsroom, beat }
  }

  const contentType = getAnyOf(pathname.match(contentTypePathRegex)?.[1], contentTypes)

  if (contentType) {
    return { kind: 'contentType', newsroom, contentType }
  }

  return { kind: 'newsroom', newsroom }
}

export const newswireHandler: PlatformHandler = {
  match: (url) => {
    return parseNewswireUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNewswireUrl(url)

    if (!parsed) {
      return []
    }

    const { newsroom } = parsed
    const uris: Array<DiscoverUriEntry> = []

    // A made-up beat redirects to the newsroom's /browse page, which validation drops.
    if (parsed.kind === 'beat') {
      uris.push(feeds.getFeedEntry('newswire:beat', { newsroom, beat: parsed.beat }))
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'news') {
      uris.push(feeds.getFeedEntry('newswire:news', { newsroom }))
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'pr') {
      uris.push(feeds.getFeedEntry('newswire:press-releases', { newsroom }))
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'social') {
      uris.push(feeds.getFeedEntry('newswire:social', { newsroom }))
    }

    uris.push(feeds.getFeedEntry('newswire:newsroom', { newsroom }))

    return uris
  },

  getFeedHint: feeds.getFeedHint,
}

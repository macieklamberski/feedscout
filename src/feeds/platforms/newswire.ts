import { getAnyOf, getSubdomain, isAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

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

// Wildcard DNS sends every label to the newsroom farm. www is the service's own site, cdn serves
// its assets and support is the help desk.
const excludedSubdomains = ['cdn', 'support', 'www']

export const parseNewswireUrl = (url: string): NewswireUrl | undefined => {
  const pathname = parseUrl(url)?.pathname
  const newsroom = getSubdomain(url, domains)

  // A dotted subdomain such as www.{newsroom} names no newsroom.
  if (!pathname || !newsroom || newsroom.includes('.') || isAnyOf(newsroom, excludedSubdomains)) {
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

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // A made-up beat redirects to the newsroom's /browse page, which validation drops.
    if (parsed.kind === 'beat') {
      uris.push({
        uri: `${origin}/browse/rss/beat/${parsed.beat}`,
        hint: composeHint('newswire:beat'),
      })
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'news') {
      uris.push({ uri: `${origin}/browse/rss/news`, hint: composeHint('newswire:news') })
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'pr') {
      uris.push({ uri: `${origin}/browse/rss/pr`, hint: composeHint('newswire:press-releases') })
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'social') {
      uris.push({ uri: `${origin}/browse/rss/social`, hint: composeHint('newswire:social') })
    }

    uris.push({ uri: `${origin}/browse/rss`, hint: composeHint('newswire:newsroom') })

    return uris
  },
}

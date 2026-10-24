import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home, profile (guess, html), partly covers latest.
// Handler needed for: article, tag.

export type DevtoUrl =
  | { kind: 'profile'; owner: string }
  | { kind: 'tag'; tag: string }
  | { kind: 'latest' }
  | { kind: 'home' }

const hosts = ['dev.to', 'www.dev.to']
// An article lives under its author's name, a user or an organization: /{name}/{slug}.
const ownerRegex = /^\/([a-zA-Z0-9_-]+)(?:\/|$)/i
const tagRegex = /^\/t\/([^/]+)/i
const latestRegex = /^\/latest\/?$/i

export const parseDevtoUrl = (url: string): DevtoUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  // Homepage: global community feed.
  if (parsedUrl.pathname === '/') {
    return { kind: 'home' }
  }

  // Latest sort: /latest.
  if (latestRegex.test(parsedUrl.pathname)) {
    return { kind: 'latest' }
  }

  const tag = parsedUrl.pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  const owner = parsedUrl.pathname.match(ownerRegex)?.[1]

  if (!owner) {
    return
  }

  return { kind: 'profile', owner }
}

export const devtoHandler: PlatformHandler = {
  match: (url) => {
    return parseDevtoUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseDevtoUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'home') {
      return [{ uri: 'https://dev.to/feed', hint: composeHint('devto:community') }]
    }

    if (parsed.kind === 'latest') {
      return [
        { uri: 'https://dev.to/feed/latest', hint: composeHint('devto:latest') },
        { uri: 'https://dev.to/feed', hint: composeHint('devto:community') },
      ]
    }

    if (parsed.kind === 'tag') {
      return [{ uri: `https://dev.to/feed/tag/${parsed.tag}`, hint: composeHint('devto:tag') }]
    }

    return [{ uri: `https://dev.to/feed/${parsed.owner}`, hint: composeHint('devto:posts') }]
  },
}

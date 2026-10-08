import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ViablogaUrl = { kind: 'blog' }

const domains = ['viabloga.com']

// The portal, and names that answer 403 or time out with no blog behind them.
const excludedSubdomains = ['images', 'news', 'support', 'test', 'viabloga2', 'www']

export const parseViablogaUrl = (url: string): ViablogaUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  // A nested subdomain like www.{blog}.viabloga.com redirects to {blog}.viabloga.com.
  if (!subdomain || subdomain.includes('.')) {
    return
  }

  if (isAnyOf(subdomain, excludedSubdomains)) {
    return
  }

  return { kind: 'blog' }
}

export const viablogaHandler: PlatformHandler = {
  match: (url) => {
    return parseViablogaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseViablogaUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [
      { uri: `${origin}/index.xml`, hint: composeHint('viabloga:posts', 'rss') },
      { uri: `${origin}/atom.xml`, hint: composeHint('viabloga:posts', 'atom') },
      { uri: `${origin}/index.rdf`, hint: composeHint('viabloga:posts', 'rdf') },
      { uri: `${origin}/comments.xml`, hint: composeHint('viabloga:comments', 'rss') },
      { uri: `${origin}/wiki.rdf`, hint: composeHint('viabloga:wiki', 'rdf') },
    ]
  },
}

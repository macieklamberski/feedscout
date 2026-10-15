import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type ViablogaUrl = { kind: 'blog' }

const domains = ['viabloga.com']

export const parseViablogaUrl = (url: string): ViablogaUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
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

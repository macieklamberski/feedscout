import { getPathSegments, isAnyOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers site (html), partly covers section.

export type WebnodeUrl = { kind: 'section'; section: string } | { kind: 'site' }

const clientScriptPrefix = 'https://d11bh4d8fhuq47.cloudfront.net/_system/client/'

// Articles, e-shop products and article archives, whose slugs can repeat a section's slug.
const excludedPaths = ['archive', 'news', 'products']

// The classic editor loads its client script from this host on every page. Webnode 2 pages load
// none of it and serve no feeds.
export const isWebnodeHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && (element.attribs.src ?? '').startsWith(clientScriptPrefix)
  })

  return script !== undefined
}

// A section feed is named after the slug of the page holding its articles, at any depth.
export const parseWebnodeUrl = (url: string): WebnodeUrl => {
  const segments = getPathSegments(url)
  const section = segments.at(-1)

  if (!section || isAnyOf(segments[0], excludedPaths)) {
    return { kind: 'site' }
  }

  return { kind: 'section', section }
}

export const webnodeHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isWebnodeHtml })
  },

  resolve: (url) => {
    const parsed = parseWebnodeUrl(url)
    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'section') {
      uris.push({
        uri: `${origin}/rss/${parsed.section}.xml`,
        hint: composeHint('webnode:section'),
      })
    }

    uris.push({ uri: `${origin}/rss/all.xml`, hint: composeHint('webnode:articles') })

    return uris
  },
}

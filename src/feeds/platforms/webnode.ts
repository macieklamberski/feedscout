import { webnode } from 'feedintel'
import { getPathSegments, isAnyOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: articles.
// Handler needed for: section.

export type WebnodeUrl = { kind: 'section'; section: string } | { kind: 'site' }

const clientScriptPrefix = 'https://d11bh4d8fhuq47.cloudfront.net/_system/client/'

// Articles, e-shop products and article archives belong to the site, and their slugs can repeat a
// section's slug.
const itemPaths = ['archive', 'news', 'products']

const feeds = withHintLabels(webnode.feeds)

// The classic editor loads its client script from this host on every page. Webnode 2 pages load
// none of it and serve no feeds.
export const isWebnodeHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && (element.attribs.src ?? '').startsWith(clientScriptPrefix)
  })

  return script !== undefined
}

// A section feed is named after its articles block, which takes the page's slug, at any depth.
// A repeated name gets a number suffix the URL does not show, and that page gets the unnumbered
// feed.
export const parseWebnodeUrl = (url: string): WebnodeUrl => {
  const segments = getPathSegments(url)
  const [routeOrPage] = segments
  const section = segments.at(-1)
  // Webnode serves no feed for a non-ASCII slug on any spelling, and `/rss/sitemap.xml` of the
  // built-in `/sitemap/` page is the XML sitemap.
  const isFeedless =
    section?.includes('%') || (segments.length === 1 && isAnyOf(section, 'sitemap'))

  if (!section || isFeedless || isAnyOf(routeOrPage, itemPaths)) {
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
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    if (parsed.kind === 'section') {
      return [
        page.getFeedEntry('section', { section: parsed.section }),
        page.getFeedEntry('articles'),
      ]
    }

    return [page.getFeedEntry('articles')]
  },

  getFeedHint: feeds.getFeedHint,
}

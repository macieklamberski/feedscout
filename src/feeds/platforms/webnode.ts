import { getPathSegments, isAnyOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers article, site (html), partly covers section.

export type WebnodeUrl = { kind: 'section'; section: string } | { kind: 'site' }

// Webnode's two-letter and `com.xx` country domains, with `webnode.page` and `webnode.cat`.
// length: keeps any suffix but a two-letter country code out
const domains = [/^webnode\.(?:[a-z]{2}|com\.[a-z]{2}|page|cat)$/]

const clientScriptPrefix = 'https://d11bh4d8fhuq47.cloudfront.net/_system/client/'

// Articles, e-shop products and article archives belong to the site, and their slugs can repeat a
// section's slug.
const itemPaths = ['archive', 'news', 'products']

// A site on its own domain is known only by its marker, so its feeds are built here but not
// claimed. The site-wide row comes first, as it also fits the section row.
const feeds = definePlatformFeeds(
  [
    { key: 'webnode:articles', template: '{scheme}://{host}/rss/all.xml' },
    { key: 'webnode:section', template: '{scheme}://{host}/rss/{section}.xml' },
  ],
  { domains },
)

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
        page.getFeedEntry('webnode:section', { section: parsed.section }),
        page.getFeedEntry('webnode:articles'),
      ]
    }

    return [page.getFeedEntry('webnode:articles')]
  },

  getFeedHint: feeds.getFeedHint,
}

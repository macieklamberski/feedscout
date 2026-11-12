import { getPathSegments, isAnyOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers article, site (html), partly covers section.

export type WebnodeUrl = { kind: 'section'; section: string } | { kind: 'site' }

const domains = [
  'webnode.at',
  'webnode.be',
  'webnode.cat',
  'webnode.cl',
  'webnode.cn',
  'webnode.com.ar',
  'webnode.com.br',
  'webnode.com.co',
  'webnode.com.pt',
  'webnode.com.tr',
  'webnode.com.ua',
  'webnode.com.uy',
  'webnode.com.ve',
  'webnode.cz',
  'webnode.es',
  'webnode.fi',
  'webnode.fr',
  'webnode.gr',
  'webnode.hu',
  'webnode.in',
  'webnode.it',
  'webnode.jp',
  'webnode.kr',
  'webnode.mx',
  'webnode.nl',
  'webnode.page',
  'webnode.pt',
  'webnode.ro',
  'webnode.ru',
  'webnode.se',
  'webnode.sk',
  'webnode.tw',
  'webnode.vn',
]

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
    const uris: Array<DiscoverUriEntry> = []

    if (!page) {
      return uris
    }

    if (parsed.kind === 'section') {
      uris.push(page.getFeedEntry('webnode:section', { section: parsed.section }))
    }

    uris.push(page.getFeedEntry('webnode:articles'))

    return uris
  },

  // The table reads any host under the domains, so only a site's own subdomain is claimed, not the
  // apex, www or a nested host.
  getFeedHint: (url) => {
    if (!getTenantSubdomain(url, domains)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}

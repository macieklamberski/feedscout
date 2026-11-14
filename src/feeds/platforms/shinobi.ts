import { isHostOrSubdomainOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShinobiUrl = { kind: 'blog'; blog: string }

// Ninja Blog serves its blogs as subdomains of 101 domains. Only its branded one is listed, and a
// blog on any other is known by the banner its pages print.
const domains = ['blog.shinobi.jp']

const bannerLogoRegex = /^\/admin\/img\/blogheader_logo\.png$/i

// A blog serves one feed under every path below: RSS 2.0 at /RSS/, /RSS/200/ and /OPML, RSS 0.91 at
// /RSS/091/, RSS 1.0 at /RSS/100/ and Atom at /ATOM/. The server ignores what follows a feed path,
// so /RSS/200/RSS is the RSS 2.0 feed too.
const feeds = definePlatformFeeds(
  [
    { key: 'shinobi:posts', template: '{scheme}://{host}/RSS/', format: 'rss' },
    { key: 'shinobi:posts', template: '{scheme}://{host}/ATOM/', format: 'atom' },
    { key: 'shinobi:posts', template: '{scheme}://{host}/RSS/200/', format: 'rss', isAlias: true },
    { key: 'shinobi:posts', template: '{scheme}://{host}/RSS/RSS/', format: 'rss', isAlias: true },
    {
      key: 'shinobi:posts',
      template: '{scheme}://{host}/RSS/200/RSS/',
      format: 'rss',
      isAlias: true,
    },
    { key: 'shinobi:posts', template: '{scheme}://{host}/OPML', format: 'rss', isAlias: true },
    { key: 'shinobi:posts', template: '{scheme}://{host}/RSS/091/', format: 'rss', isAlias: true },
    {
      key: 'shinobi:posts',
      template: '{scheme}://{host}/RSS/091/index.rdf',
      format: 'rss',
      isAlias: true,
    },
    { key: 'shinobi:posts', template: '{scheme}://{host}/RSS/100/', format: 'rdf' },
    {
      key: 'shinobi:posts',
      template: '{scheme}://{host}/RSS/100/RSS/',
      format: 'rdf',
      isAlias: true,
    },
  ],
  { domains },
)

// Every blog page prints the Ninja Blog banner, whose logo loads from the blog's own host.
export const isShinobiHtml = (content: string): boolean => {
  const logo = findElement(content, (element) => {
    return element.name === 'img' && bannerLogoRegex.test(element.attribs.src ?? '')
  })

  return logo !== undefined
}

export const parseShinobiUrl = (url: string): ShinobiUrl | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const shinobiHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!isHostOrSubdomainOf(url, domains)) {
      return hasMarker(content, headers, { html: isShinobiHtml })
    }

    return parseShinobiUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!page || (isHostOrSubdomainOf(url, domains) && !parseShinobiUrl(url))) {
      return []
    }

    return [
      page.getFeedEntry('shinobi:posts', {}, 'rss'),
      page.getFeedEntry('shinobi:posts', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}

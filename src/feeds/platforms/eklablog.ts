import { isHostOf, isHostOrSubdomainOf, resolveUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, customDomain.

export type EklablogUrl = { kind: 'blog' } | { kind: 'customDomain' }

// The domains holding at least 1% of Eklablog's stored feeds each. A blog on another one, or on a
// custom domain, is known by its marker.
const domains = [
  'blogg.org',
  'cd.st',
  'ek.la',
  'eklablog.com',
  'eklablog.fr',
  'eklablog.net',
  'id.st',
  'kazeo.com',
  'lo.gs',
  'revolublog.com',
  'zic.fr',
]
const connectHosts = ['connect.eklablog.com']

// A blog off the domains is known only by its marker, so its feeds are built here but not claimed.
const feeds = definePlatformFeeds(
  [
    { key: 'eklablog:posts', template: '{scheme}://{host}/rss' },
    { key: 'eklablog:comments', template: '{scheme}://{host}/rss/comments' },
  ],
  { domains },
)

const isConnectScript = (src: string | undefined): boolean => {
  return isHostOf(resolveUrl(src ?? '') ?? '', connectHosts)
}

// Every blog page loads the login ping script from connect.eklablog.com, on a custom domain too.
export const isEklablogHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && isConnectScript(element.attribs.src)
  })

  return script !== undefined
}

export const parseEklablogUrl = (url: string): EklablogUrl | undefined => {
  if (!isHostOrSubdomainOf(url, domains)) {
    return { kind: 'customDomain' }
  }

  const subdomain = getTenantSubdomain(url, domains)

  if (!subdomain) {
    return
  }

  return { kind: 'blog' }
}

export const eklablogHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsed = parseEklablogUrl(url)

    if (parsed?.kind === 'customDomain') {
      return hasMarker(content, headers, { html: isEklablogHtml })
    }

    return parsed !== undefined
  },

  resolve: (url) => {
    const parsed = parseEklablogUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('eklablog:posts'), pageFeeds.getFeedEntry('eklablog:comments')]
  },

  // The table reads any host under the domains, so the page parser refuses the apex and the www
  // host first, whose /rss ends in a 404, and a www or nested subdomain of a blog. Over https both
  // fail their TLS check, and over http the www one redirects to the blog's feed and a nested one
  // answers 404.
  getFeedHint: (url) => {
    if (parseEklablogUrl(url)?.kind !== 'blog') {
      return
    }

    return feeds.getFeedHint(url)
  },
}

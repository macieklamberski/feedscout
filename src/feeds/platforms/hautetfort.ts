import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HautetfortUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'category'; blog: string; category: string }

// Business blogs sit under blog.blogspirit-business.com, which comes before its parent so their
// name reads as one label.
const domains = [
  'hautetfort.com',
  'blogspirit.com',
  'blog.blogspirit-business.com',
  'blogspirit-business.com',
]

const categoryRegex = /^\/([^/.]+)\/?$/
const archivesCategoryRegex = /^\/archives\/category\/([^/]+)(?:\/|$)/i

// Blog subdomains serve no certificate for their own name, so the feeds stay on http.
const feeds = definePlatformFeeds(
  [
    { key: 'hautetfort:category', template: 'http://{blog}.{domain}/{category}/index.rss' },
    { key: 'hautetfort:posts', template: 'http://{blog}.{domain}/atom.xml', format: 'atom' },
    { key: 'hautetfort:posts', template: 'http://{blog}.{domain}/index.rss', format: 'rss' },
  ],
  { domains },
)

export const parseHautetfortUrl = (url: string): HautetfortUrl | undefined => {
  const pathname = parseUrl(url)?.pathname

  if (!pathname) {
    return
  }

  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  const archivesCategory = pathname.match(archivesCategoryRegex)?.[1]

  if (archivesCategory) {
    return { kind: 'category', blog, category: archivesCategory }
  }

  const category = pathname.match(categoryRegex)?.[1]

  if (category) {
    return { kind: 'category', blog, category }
  }

  return { kind: 'blog', blog }
}

export const hautetfortHandler: PlatformHandler = {
  match: (url) => {
    return parseHautetfortUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHautetfortUrl(url)

    if (!parsed) {
      return []
    }

    const domain = new URL(url).hostname.slice(parsed.blog.length + 1)
    const params = { blog: parsed.blog, domain }
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'category') {
      uris.push(feeds.getFeedEntry('hautetfort:category', { ...params, category: parsed.category }))
    }

    uris.push(
      feeds.getFeedEntry('hautetfort:posts', params, 'atom'),
      feeds.getFeedEntry('hautetfort:posts', params, 'rss'),
    )

    return uris
  },

  getFeedHint: feeds.getFeedHint,
}

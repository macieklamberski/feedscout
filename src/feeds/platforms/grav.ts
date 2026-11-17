import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: page.

export type GravUrl = { kind: 'home' } | { kind: 'page'; path: string }

const trailingSlashRegex = /\/$/
const htmlSuffixRegex = /\.html$/i
const paginationRegex = /\/page:\d+$/i
const gravAssetRegex = /\/user\/(?:themes|plugins)\//i
const gravCookieRegex = /^grav-site-[0-9a-f]+$/

// A site is self-hosted on any domain, so the table only builds its feeds. The site root has no
// path to suffix, so its feed is `/.rss`.
const feeds = definePlatformFeeds([
  { key: 'grav:page', main: '{root}/{path*}.rss', format: 'rss' },
  { key: 'grav:page', main: '{root}/.rss', format: 'rss' },
  { key: 'grav:page', main: '{root}/{path*}.atom', format: 'atom' },
  { key: 'grav:page', main: '{root}/.atom', format: 'atom' },
])

// `GravCMS` in full, since the value is compared as a prefix and `Grav` matches `Gravity Forms`.
export const isGravHtml = (content: string): boolean => {
  if (hasMetaContent(content, 'generator', 'GravCMS')) {
    return true
  }

  const asset = findElement(content, (element) => {
    if (element.name === 'link') {
      return gravAssetRegex.test(element.attribs.href ?? '')
    }

    if (element.name === 'script') {
      return gravAssetRegex.test(element.attribs.src ?? '')
    }

    return false
  })

  return asset !== undefined
}

export const isGravHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => gravCookieRegex.test(name))
}

export const parseGravUrl = (url: string): GravUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  // Grav serves `/blog.html` as the `/blog` page, whose feed is `/blog.rss`, and pages a listing
  // with a `page:{n}` parameter.
  const path = parsedUrl.pathname
    .replace(trailingSlashRegex, '')
    .replace(htmlSuffixRegex, '')
    .replace(paginationRegex, '')

  if (!path) {
    return { kind: 'home' }
  }

  return { kind: 'page', path }
}

export const gravHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isGravHtml, headers: isGravHeaders })) {
      return false
    }

    return parseGravUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseGravUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const path = parsed.kind === 'page' ? parsed.path.slice(1) : undefined

    return [
      page.getFeedEntry('grav:page', { path }, 'rss'),
      page.getFeedEntry('grav:page', { path }, 'atom'),
    ]
  },
}

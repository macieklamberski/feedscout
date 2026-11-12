import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElements, formatSuffixRegex, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type WeeblyUrl = { kind: 'home' } | { kind: 'blog'; page?: string }
export type WeeblyPage = { kind: 'home'; pages: Array<string> } | { kind: 'blog'; page?: string }

const domains = ['weebly.com']

// A page link is one segment with an optional .html, as `/newsletter.html` or `/newsletter`. Any
// other dot marks a file, such as `/favicon.ico`.
const pageLinkRegex = /^\/([^/.]+)(?:\.html)?$/i

const feeds = definePlatformFeeds([
  { key: 'weebly:blog', template: '{scheme}://{site}.weebly.com/{page}/feed' },
])

export const parseWeeblyUrl = (url: string): WeeblyUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  // A blog sits under its page slug, such as /articles/feed, or under a numeric blog id, such as
  // /1/feed. A page address ends in `.html`, which redirects to the bare slug the blog feed sits
  // under.
  const [pageSegment] = getPathSegments(url)
  const routeOrPage = pageSegment?.replace(formatSuffixRegex, '')

  if (!routeOrPage) {
    return { kind: 'home' }
  }

  if (!isAnyOf(routeOrPage, 'blog')) {
    return { kind: 'blog', page: routeOrPage }
  }

  return { kind: 'blog' }
}

export const getWeeblyPage = (url: string, content: string | undefined): WeeblyPage | undefined => {
  const parsed = parseWeeblyUrl(url)

  if (parsed?.kind !== 'home') {
    return parsed
  }

  // A site can run a blog on any of its pages, and the home page links every page, so each page
  // it links is a blog candidate beside the default /blog. Validation drops the pages that are
  // not blogs.
  const pages = new Set(['blog'])
  const { hostname } = new URL(url)
  const anchors = content ? findElements(content, (element) => element.name === 'a') : []

  for (const anchor of anchors) {
    const target = parseUrl(anchor.attribs.href, url)

    if (!target || !isHostOf(target, hostname)) {
      continue
    }

    const page = target.pathname.match(pageLinkRegex)?.[1]

    if (page) {
      pages.add(isAnyOf(page, 'blog') ? 'blog' : page)
    }
  }

  return { kind: 'home', pages: [...pages] }
}

export const weeblyHandler: PlatformHandler = {
  match: (url) => {
    return parseWeeblyUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getWeeblyPage(url, content)
    const site = getTenantSubdomain(url, domains)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !site || !pageFeeds) {
      return []
    }

    const slugs = page.kind === 'home' ? page.pages : [page.page ?? 'blog']

    return slugs.map((slug) => pageFeeds.getFeedEntry('weebly:blog', { site, page: slug }))
  },

  // The table reads any first segment as a page, so a dotted one, a file of the site, is refused:
  // /robots.txt/feed and /sitemap.xml/feed answer with a 404 or an empty body, never a feed.
  getFeedHint: (url) => {
    const [pageSegment] = getPathSegments(url)

    if (!pageSegment || formatSuffixRegex.test(pageSegment)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}

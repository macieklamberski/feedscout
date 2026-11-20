import { textpattern } from 'feedintel'
import { decodeSegment, getQueryParam, isAnyOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TextpatternPage =
  | { kind: 'site'; siteUrl: string }
  | { kind: 'section'; siteUrl: string; section: string }
  | { kind: 'category'; siteUrl: string; category: string }

const feedPathRegex = /\/(?:atom|rss)\/?$/i
const trailingSlashRegex = /\/$/

// The routes Textpattern puts in front of a value in place of a section.
const reservedRoutes = ['author', 'category', 'file_download']

const feeds = withHintLabels(textpattern.feeds)

export const isTextpatternHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Textpattern')
}

// Textpattern serves its feeds at `{site}/rss` and `{site}/atom`, so the feed link a theme prints
// names the site root. It counts only on the page's own host, under a root that holds the page.
const getSiteUrl = (url: string, content: string | undefined): string | undefined => {
  const parsedUrl = new URL(url)

  const feedLink = findElement(content, (element) => {
    if (element.name !== 'link' || element.attribs.rel !== 'alternate') {
      return false
    }

    return feedPathRegex.test(parseUrl(element.attribs.href, url)?.pathname ?? '')
  })

  if (!feedLink) {
    return
  }

  const feedUrl = parseUrl(feedLink.attribs.href, url)

  if (!feedUrl || feedUrl.origin !== parsedUrl.origin) {
    return
  }

  const sitePath = feedUrl.pathname.replace(feedPathRegex, '')

  if (!`${parsedUrl.pathname}/`.startsWith(`${sitePath}/`)) {
    return
  }

  return `${parsedUrl.origin}${sitePath}`
}

// A clean URL names the section first and a category under `/category/`, and a messy one names
// them in `?s=` and `?c=`.
export const getTextpatternPage = (url: string, content: string | undefined): TextpatternPage => {
  const parsedUrl = new URL(url)
  const siteUrl = getSiteUrl(url, content) ?? parsedUrl.origin
  const sitePath = new URL(siteUrl).pathname.replace(trailingSlashRegex, '')
  const [route, value] = parsedUrl.pathname.slice(sitePath.length).split('/').filter(Boolean)
  const queryCategory = getQueryParam(parsedUrl, 'c')
  const querySection = getQueryParam(parsedUrl, 's')

  if (queryCategory) {
    return { kind: 'category', siteUrl, category: queryCategory }
  }

  if (querySection) {
    return { kind: 'section', siteUrl, section: querySection }
  }

  if (isAnyOf(route, 'category') && value) {
    return { kind: 'category', siteUrl, category: decodeSegment(value) ?? value }
  }

  if (!route || isAnyOf(route, reservedRoutes) || route.includes('.')) {
    return { kind: 'site', siteUrl }
  }

  return { kind: 'section', siteUrl, section: decodeSegment(route) ?? route }
}

export const textpatternHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isTextpatternHtml })
  },

  resolve: (url, content) => {
    const page = getTextpatternPage(url, content)

    if (page.kind === 'section') {
      const params = { root: page.siteUrl, section: page.section }

      return [
        feeds.getFeedEntry('section', params, 'rss'),
        feeds.getFeedEntry('section', params, 'atom'),
        feeds.getFeedEntry('posts', params, 'rss'),
        feeds.getFeedEntry('posts', params, 'atom'),
      ]
    }

    if (page.kind === 'category') {
      const params = { root: page.siteUrl, category: page.category }

      return [
        feeds.getFeedEntry('category', params, 'rss'),
        feeds.getFeedEntry('category', params, 'atom'),
        feeds.getFeedEntry('posts', params, 'rss'),
        feeds.getFeedEntry('posts', params, 'atom'),
      ]
    }

    return [
      feeds.getFeedEntry('posts', { root: page.siteUrl }, 'rss'),
      feeds.getFeedEntry('posts', { root: page.siteUrl }, 'atom'),
    ]
  },
}

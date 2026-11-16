import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html).
// Handler needed for: home.

export type OpencartJournalPage = {
  kind: 'store'
  storeUrl: string
  version: 'journal2' | 'journal3'
}

// A store is known only by its markup, so its feeds are built under the store root and claimed on
// no host. The blog route is named for the Journal version. OpenCart 4 separates a route's method
// with a dot and answers the slash form with a 404, and only Journal 3 runs on it, so its dot form
// is a second spelling of the Journal 3 feed.
const feeds = definePlatformFeeds([
  {
    key: 'opencart-journal:blog',
    template: '{root}/index.php?route={version}/blog/feed',
    format: 'rss',
  },
  {
    key: 'opencart-journal:blog',
    template: '{root}/index.php?route=journal3/blog.feed',
    format: 'rss',
    isAlias: true,
  },
])

// Journal prints its version on the `<html>` element of every page: `data-j2v` on Journal 2,
// `data-jv` on Journal 3. Other scripts put `data-jv` on form fields, never on `<html>`.
const getJournalVersion = (content: string): OpencartJournalPage['version'] | undefined => {
  const html = findElement(content, (element) => element.name === 'html')

  if (html?.attribs['data-j2v'] !== undefined) {
    return 'journal2'
  }

  if (html?.attribs['data-jv'] !== undefined) {
    return 'journal3'
  }
}

export const isOpencartJournalHtml = (content: string): boolean => {
  return getJournalVersion(content) !== undefined
}

// OpenCart prints the store root as `<base href>`, which holds a sub-path install's directory.
export const getOpencartJournalPage = (
  url: string,
  content: string | undefined,
): OpencartJournalPage | undefined => {
  if (!content) {
    return
  }

  const version = getJournalVersion(content)

  if (!version) {
    return
  }

  const base = findElement(content, (element) => element.name === 'base')
  // The store is the base's directory: an empty base would otherwise keep the page's own query.
  const baseUrl = parseUrl(base?.attribs.href ?? '/', url) ?? new URL('/', url)
  const storeUrl = new URL('.', baseUrl).href

  return { kind: 'store', storeUrl, version }
}

export const opencartJournalHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isOpencartJournalHtml })
  },

  resolve: (url, content) => {
    const page = getOpencartJournalPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const root = page.storeUrl

    if (page.version === 'journal2') {
      return [
        pageFeeds.getFeedEntry('opencart-journal:blog', { root, version: page.version }, 'rss'),
      ]
    }

    return [
      pageFeeds.getFeedSpellings('opencart-journal:blog', { root, version: page.version }, 'rss'),
    ]
  },
}

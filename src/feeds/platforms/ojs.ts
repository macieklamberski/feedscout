import { ojs } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  findElement,
  getCookieNames,
  getSiteParams,
  getSiteUrl,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: articles.
// Handler needed for: announcements.

export type OjsPage = { kind: 'journal'; journalUrl: string }

const feeds = withHintLabels(ojs.feeds)

export const isOjsHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Open Journal Systems')
}

export const isOjsHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('OJSSID')
}

export const getOjsPage = (content: string | undefined): OjsPage | undefined => {
  const getComponentRoot = (href: string | undefined): string | undefined => {
    const page = ojs.pages.readUrl(href ?? '', { isAnyHost: true })

    if (page?.key !== 'component') {
      return
    }

    return getSiteUrl(page.values)
  }
  const stylesheet = findElement(content, (element) => {
    return element.name === 'link' && getComponentRoot(element.attribs.href) !== undefined
  })
  const rootUrl = getComponentRoot(stylesheet?.attribs.href)

  if (!rootUrl) {
    return
  }

  // An OJS 3.5 locale feed url loops on a cookie redirect without a cookie, so the root, which
  // redirects to the default locale, is emitted.
  return { kind: 'journal', journalUrl: rootUrl }
}

export const ojsHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    if (!hasMarker(content, headers, { html: isOjsHtml, headers: isOjsHeaders })) {
      return false
    }

    return getOjsPage(content) !== undefined
  },

  resolve: (_url, content) => {
    const page = getOjsPage(content)

    if (!page) {
      return []
    }

    const params = getSiteParams(page.journalUrl)

    return [
      feeds.getFeedEntry('articles', params, 'atom'),
      feeds.getFeedEntry('articles', params, 'rdf'),
      feeds.getFeedEntry('articles', params, 'rss'),
      feeds.getFeedEntry('announcements', params, 'atom'),
      feeds.getFeedEntry('announcements', params, 'rdf'),
      feeds.getFeedEntry('announcements', params, 'rss'),
    ]
  },
}

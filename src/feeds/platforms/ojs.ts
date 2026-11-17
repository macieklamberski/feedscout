import { getPathSegments, isAnyOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: articles.
// Handler needed for: announcements.

export type OjsPage = { kind: 'journal'; journalUrl: string }

// OJS loads its theme stylesheets through the component router under the journal's root.
const componentRouterRegex = /^(https?:\/\/.+?)\/\$\$\$call\$\$\$\//i

// OJS is self-hosted and known only by its page marker, so nothing in a feed URL names it and the
// table only builds, under the journal root the page names.
const feeds = definePlatformFeeds('ojs', [
  { key: 'articles', main: '{root}/gateway/plugin/WebFeedGatewayPlugin/atom', format: 'atom' },
  { key: 'articles', main: '{root}/gateway/plugin/WebFeedGatewayPlugin/rss', format: 'rdf' },
  { key: 'articles', main: '{root}/gateway/plugin/WebFeedGatewayPlugin/rss2', format: 'rss' },
  {
    key: 'announcements',
    main: '{root}/gateway/plugin/AnnouncementFeedGatewayPlugin/atom',
    format: 'atom',
  },
  {
    key: 'announcements',
    main: '{root}/gateway/plugin/AnnouncementFeedGatewayPlugin/rss',
    format: 'rdf',
  },
  {
    key: 'announcements',
    main: '{root}/gateway/plugin/AnnouncementFeedGatewayPlugin/rss2',
    format: 'rss',
  },
])

export const isOjsHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Open Journal Systems')
}

export const isOjsHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('OJSSID')
}

export const getOjsPage = (content: string | undefined): OjsPage | undefined => {
  const stylesheet = findElement(content, (element) => {
    return element.name === 'link' && componentRouterRegex.test(element.attribs.href ?? '')
  })
  const rootUrl = stylesheet?.attribs.href?.match(componentRouterRegex)?.[1]

  if (!rootUrl) {
    return
  }

  // The site-wide pages of a multi-journal install sit under the reserved `index` path.
  if (isAnyOf(getPathSegments(rootUrl).at(-1), 'index')) {
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

    const params = { root: page.journalUrl }

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

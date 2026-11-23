import { plone } from 'feedintel'
import { anyWordMatchesAnyOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { type Element, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PlonePage =
  | { kind: 'search'; portalUrl: string; query: string }
  | { kind: 'site'; portalUrl: string }
  | { kind: 'folder'; folderUrl: string }

const portalTypeRegex = /^portaltype-/
const errorTemplateRegex = /^template-(?:default_)?error_message/
const trailingSlashRegex = /\/$/

// Content types that hold no items, so Plone serves no syndication feed for them.
const itemPortalTypes = [
  'portaltype-document',
  'portaltype-event',
  'portaltype-file',
  'portaltype-image',
  'portaltype-link',
  'portaltype-news-item',
]

const feeds = withHintLabels(plone.feeds)

const findBody = (content: string | undefined) => {
  return findElement(content, (element) => {
    return element.name === 'body'
  })
}

// Every classic Plone template prints the content type as a body class. Volto prints none.
export const isPloneHtml = (content: string): boolean => {
  return anyWordMatchesAnyOf(findBody(content)?.attribs.class ?? '', [portalTypeRegex])
}

// Plone 4 prints no `data-portal-url`, and its search link names the portal.
const getPortalUrl = (
  content: string | undefined,
  body: Element | undefined,
): string | undefined => {
  const portalUrl = body?.attribs['data-portal-url']

  if (portalUrl) {
    return portalUrl
  }

  const searchLink = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'search'
  })
  const searchPage = plone.pages.read(searchLink?.attribs.href ?? '', { isAnyHost: true })

  if (searchPage?.key !== 'search') {
    return
  }

  return searchPage.params.root
}

// Plone 5 and later print the context URL on the body, Plone 4 as `<base>`. The search page links
// `search_rss` with its own query string, and a folder or collection links its syndication feeds
// under the context URL, which a default page or a view name leaves out.
export const getPlonePage = (url: string, content: string | undefined): PlonePage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const body = findBody(content)
  const baseElement = findElement(content, (element) => {
    return element.name === 'base'
  })
  const portalUrl = getPortalUrl(content, body)
  const contextUrl = (body?.attribs['data-base-url'] ?? baseElement?.attribs.href)?.replace(
    trailingSlashRegex,
    '',
  )

  // An error page prints the portal type of the nearest existing context.
  if (anyWordMatchesAnyOf(body?.attribs.class ?? '', [errorTemplateRegex])) {
    return
  }

  const searchPage = plone.pages.read(url, { isAnyHost: true })

  if (searchPage?.key === 'search') {
    return {
      kind: 'search',
      portalUrl: portalUrl ?? searchPage.params.root,
      query: parsedUrl.search.slice(1),
    }
  }

  const siteUrl = portalUrl ?? parsedUrl.origin
  const isSitePage = plone.pages.read(url, { root: siteUrl })?.key === 'site'

  // The site root links the site feeds even when a document is its default page.
  if (isSitePage || contextUrl === siteUrl) {
    return { kind: 'site', portalUrl: siteUrl }
  }

  if (!contextUrl || anyWordMatchesAnyOf(body?.attribs.class ?? '', itemPortalTypes)) {
    return
  }

  return { kind: 'folder', folderUrl: contextUrl }
}

export const ploneHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isPloneHtml })) {
      return false
    }

    return getPlonePage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getPlonePage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    if (page.kind === 'search') {
      return [pageFeeds.getFeedEntry('search', { root: page.portalUrl, query: page.query })]
    }

    if (page.kind === 'site') {
      const params = { root: page.portalUrl }

      return [
        pageFeeds.getFeedEntry('site', params, 'rdf'),
        pageFeeds.getFeedEntry('site', params, 'rss'),
        pageFeeds.getFeedEntry('site', params, 'atom'),
      ]
    }

    const params = { root: page.folderUrl }

    return [
      pageFeeds.getFeedEntry('folder', params, 'rdf'),
      pageFeeds.getFeedEntry('folder', params, 'rss'),
      pageFeeds.getFeedEntry('folder', params, 'atom'),
    ]
  },
}

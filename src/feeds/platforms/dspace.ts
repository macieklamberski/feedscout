import { isAnyOf, isHttpUrl, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  findElement,
  findElements,
  getMetaContent,
  getScriptText,
  hasElementWithId,
  hasMarker,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers legacyCollection, legacyCommunity, legacyHome (html), partly covers community.
// Handler needed for: collection, home.

const scopePathRegex =
  /\/(collections|communities)\/([\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12})(?:\/|$)/i
const transferStateEntityRegex = /&([aglqs]);/g
const trailingSlashesRegex = /\/+$/
const legacyFeedPathRegex = /\/feed\/(rss_1\.0|rss_2\.0|atom_1\.0)\/(site|[^/]+\/[^/]+)$/i
const legacyStylesheetRegex = /\/static\/css\/bootstrap\/dspace-theme\.css$/
const generatorRegex = /^DSpace\b/

// Angular before 16 escapes the transfer state with these entities, and later versions print JSON.
const transferStateEntities: Record<string, string> = {
  a: '&',
  g: '>',
  l: '<',
  q: '"',
  s: "'",
}

const legacyFormats: Record<string, 'atom' | 'rdf' | 'rss'> = {
  'atom_1.0': 'atom',
  'rss_1.0': 'rdf',
  'rss_2.0': 'rss',
}

type TransferState = {
  APP_CONFIG_STATE?: { rest?: { baseUrl?: unknown } }
}

type LegacyFeed = { uri: string; format: 'atom' | 'rdf' | 'rss' }

type LegacyLink = LegacyFeed & { scope: string; title?: string }

export type DspacePage =
  | { kind: 'collection'; restUrl: string; uuid: string }
  | { kind: 'community'; restUrl: string; uuid: string }
  | { kind: 'home'; restUrl: string }
  | { kind: 'legacyCollection'; feeds: Array<LegacyFeed> }
  | { kind: 'legacyCommunity'; feeds: Array<LegacyFeed> }
  | { kind: 'legacyHome'; feeds: Array<LegacyFeed> }

// The Angular UI of DSpace 7 and later renders every page inside this root element.
export const isDspaceHtml = (content: string): boolean => {
  return findElement(content, (element) => element.name === 'ds-app') !== undefined
}

// The JSPUI of DSpace 4 to 6 links this stylesheet from its page header template. Older JSPUI
// releases carry only the generator meta, which is opt-in, so the DSpace feed links the page must
// carry are the second marker.
export const isLegacyDspaceHtml = (content: string): boolean => {
  const stylesheet = findElement(content, (element) => {
    return element.name === 'link' && legacyStylesheetRegex.test(element.attribs.href ?? '')
  })

  if (stylesheet) {
    return true
  }

  return generatorRegex.test(getMetaContent(content, 'generator') ?? '')
}

// The XMLUI of DSpace 6 and older runs on Apache Cocoon. Other Cocoon apps send the header too,
// so the DSpace feed links the page must carry are the second marker.
export const isLegacyDspaceHeaders = (headers: Headers): boolean => {
  return headers.has('x-cocoon-version')
}

// DSpace 6 and older links its feeds on the home, community and collection pages.
const getLegacyLinks = (url: string, content: string): Array<LegacyLink> => {
  const links = findElements(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'alternate'
  })
  const legacyLinks: Array<LegacyLink> = []

  for (const link of links) {
    const feedUrl = parseUrl(link.attribs.href ?? '', url)
    const [, format, scope] = feedUrl?.pathname.match(legacyFeedPathRegex) ?? []

    if (!feedUrl || !format || !scope) {
      continue
    }

    legacyLinks.push({
      uri: feedUrl.href,
      format: legacyFormats[format.toLowerCase()],
      scope,
      title: link.attribs.title,
    })
  }

  return legacyLinks
}

// The JSPUI titles a scoped link with the kind in fixed English, and the XMLUI names the page's
// viewer. A page links the feeds of one scope only, so the first link decides the kind.
const getLegacyPage = (content: string, links: Array<LegacyLink>): DspacePage | undefined => {
  const [link] = links
  const feeds = links.map(({ uri, format }) => ({ uri, format }))

  if (isAnyOf(link.scope, 'site')) {
    return { kind: 'legacyHome', feeds }
  }

  if (
    link.title === 'Items in Collection' ||
    hasElementWithId(content, 'aspect_artifactbrowser_CollectionViewer_div_collection-home')
  ) {
    return { kind: 'legacyCollection', feeds }
  }

  if (
    link.title === 'Items in Community' ||
    hasElementWithId(content, 'aspect_artifactbrowser_CommunityViewer_div_community-home')
  ) {
    return { kind: 'legacyCommunity', feeds }
  }
}

// A made-up collection or community id still renders the app shell, with this element in place
// of the page, and the search feed answers an unknown scope with the site feed.
const isNotFoundHtml = (content: string | undefined): boolean => {
  return findElement(content, (element) => element.name === 'ds-pagenotfound') !== undefined
}

// The REST API, which serves the feeds, can sit on another host than the UI, so the page's
// config names it. A page rendered without its config falls back to the default `/server`.
const getRestUrl = (origin: string, content: string | undefined): string => {
  const text = content ? getScriptText(content, 'dspace-angular-state') : undefined

  if (text) {
    try {
      const json = text.replace(transferStateEntityRegex, (entity, code) => {
        return transferStateEntities[code] ?? entity
      })
      const state: TransferState = JSON.parse(json)
      const baseUrl = state.APP_CONFIG_STATE?.rest?.baseUrl

      if (typeof baseUrl === 'string' && isHttpUrl(baseUrl)) {
        return baseUrl.replace(trailingSlashesRegex, '')
      }
    } catch {}
  }

  return `${origin}/server`
}

export const getDspacePage = (url: string, content: string | undefined): DspacePage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const legacyLinks = content && !isDspaceHtml(content) ? getLegacyLinks(url, content) : []

  if (content && legacyLinks.length > 0) {
    return getLegacyPage(content, legacyLinks)
  }

  const restUrl = getRestUrl(parsedUrl.origin, content)
  const [, route, uuid] = parsedUrl.pathname.match(scopePathRegex) ?? []

  if (!route || !uuid || isNotFoundHtml(content)) {
    return { kind: 'home', restUrl }
  }

  if (isAnyOf(route, 'collections')) {
    return { kind: 'collection', restUrl, uuid }
  }

  return { kind: 'community', restUrl, uuid }
}

const getSearchUrl = (restUrl: string, format: 'atom' | 'rss', scope?: string): string => {
  const query = new URLSearchParams({ format })

  if (scope) {
    query.set('scope', scope)
  }

  query.set('query', '*')

  return `${restUrl}/opensearch/search?${query}`
}

export const dspaceHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (hasMarker(content, headers, { html: isDspaceHtml })) {
      return true
    }

    const legacyMarkers = { html: isLegacyDspaceHtml, headers: isLegacyDspaceHeaders }

    if (!content || !hasMarker(content, headers, legacyMarkers)) {
      return false
    }

    const page = getDspacePage(url, content)

    return page !== undefined && 'feeds' in page
  },

  resolve: (url, content) => {
    const page = getDspacePage(url, content)

    if (!page) {
      return []
    }

    if (page.kind === 'legacyCollection') {
      return page.feeds.map(({ uri, format }) => {
        return { uri, hint: composeHint('dspace:collection', format) }
      })
    }

    if (page.kind === 'legacyCommunity') {
      return page.feeds.map(({ uri, format }) => {
        return { uri, hint: composeHint('dspace:community', format) }
      })
    }

    if (page.kind === 'legacyHome') {
      return page.feeds.map(({ uri, format }) => {
        return { uri, hint: composeHint('dspace:site', format) }
      })
    }

    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'collection') {
      uris.push(
        {
          uri: getSearchUrl(page.restUrl, 'atom', page.uuid),
          hint: composeHint('dspace:collection', 'atom'),
        },
        {
          uri: getSearchUrl(page.restUrl, 'rss', page.uuid),
          hint: composeHint('dspace:collection', 'rss'),
        },
      )
    }

    if (page.kind === 'community') {
      uris.push(
        {
          uri: getSearchUrl(page.restUrl, 'atom', page.uuid),
          hint: composeHint('dspace:community', 'atom'),
        },
        {
          uri: getSearchUrl(page.restUrl, 'rss', page.uuid),
          hint: composeHint('dspace:community', 'rss'),
        },
      )
    }

    uris.push(
      { uri: getSearchUrl(page.restUrl, 'atom'), hint: composeHint('dspace:site', 'atom') },
      { uri: getSearchUrl(page.restUrl, 'rss'), hint: composeHint('dspace:site', 'rss') },
    )

    return uris
  },
}

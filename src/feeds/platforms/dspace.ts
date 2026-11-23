import { dspace } from 'feedintel'
import { endsWithAnyOf, isAnyOf, isHttpUrl, isString, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
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
// Generic finds: collection, community.
// Handler needed for: site.

type LegacyFormat = 'atom' | 'rdf' | 'rss'

type LegacyKind = 'legacyCollection' | 'legacyCommunity' | 'legacyHome'

type TransferState = {
  APP_CONFIG_STATE?: { rest?: { baseUrl?: unknown } }
}

type LegacyFeed = { uri: string; format: LegacyFormat }

type LegacyLink = LegacyFeed & { scope: string; title?: string }

export type DspacePage =
  | { kind: 'collection'; restUrl: string; uuid: string }
  | { kind: 'community'; restUrl: string; uuid: string }
  | { kind: 'home'; restUrl: string }
  | { kind: LegacyKind; feeds: Array<LegacyFeed> }

const transferStateEntityRegex = /&([aglqs]);/g
const legacyFeedPathRegex =
  /\/feed\/(?<format>rss_1\.0|rss_2\.0|atom_1\.0)\/(?<scope>site|[^/]+\/[^/]+)$/i
const generatorRegex = /^DSpace\b/

// Angular before 16 escapes the transfer state with these entities, and later versions print JSON.
const transferStateEntities: Record<string, string> = {
  a: '&',
  g: '>',
  l: '<',
  q: '"',
  s: "'",
}

const legacyFormats: Record<string, LegacyFormat> = {
  'atom_1.0': 'atom',
  'rss_1.0': 'rdf',
  'rss_2.0': 'rss',
}

// The JSPUI titles a scoped link with the kind in fixed English, and the XMLUI names the page's
// viewer.
const legacyScopes: Array<{ kind: LegacyKind; title: string; viewerId: string }> = [
  {
    kind: 'legacyCollection',
    title: 'Items in Collection',
    viewerId: 'aspect_artifactbrowser_CollectionViewer_div_collection-home',
  },
  {
    kind: 'legacyCommunity',
    title: 'Items in Community',
    viewerId: 'aspect_artifactbrowser_CommunityViewer_div_community-home',
  },
]

const legacyKeys: Record<LegacyKind, string> = {
  legacyCollection: 'dspace:collection',
  legacyCommunity: 'dspace:community',
  legacyHome: 'dspace:site',
}

const feeds = withHintLabels(dspace.feeds)

// The Angular UI of DSpace 7 and later renders every page inside this root element.
export const isDspaceHtml = (content: string): boolean => {
  return findElement(content, (element) => element.name === 'ds-app') !== undefined
}

// The JSPUI of DSpace 4 to 6 links this stylesheet from its page header template. Older JSPUI
// releases carry only the generator meta, which is opt-in, so the DSpace feed links the page must
// carry are the second marker.
export const isLegacyDspaceHtml = (content: string): boolean => {
  const stylesheet = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      endsWithAnyOf(element.attribs.href, '/static/css/bootstrap/dspace-theme.css')
    )
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
    const feedUrl = parseUrl(link.attribs.href, url)
    const { format, scope } = feedUrl?.pathname.match(legacyFeedPathRegex)?.groups ?? {}

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

// A page links the feeds of one scope only, so the first link decides the kind.
const getLegacyPage = (content: string, links: Array<LegacyLink>): DspacePage | undefined => {
  const [link] = links
  const feeds = links.map(({ uri, format }) => ({ uri, format }))

  if (isAnyOf(link.scope, 'site')) {
    return { kind: 'legacyHome', feeds }
  }

  for (const scope of legacyScopes) {
    if (link.title === scope.title || hasElementWithId(content, scope.viewerId)) {
      return { kind: scope.kind, feeds }
    }
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

      if (isString(baseUrl) && isHttpUrl(baseUrl)) {
        let end = baseUrl.length

        // A regex for the trailing slashes rescans every slash run in a page-supplied value.
        while (baseUrl.endsWith('/', end)) {
          end--
        }

        return baseUrl.slice(0, end)
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
  const page = dspace.pages.read(url, { isAnyHost: true })

  if (!page || page.key === 'home' || isNotFoundHtml(content)) {
    return { kind: 'home', restUrl }
  }

  if (page.key === 'collection') {
    return { kind: 'collection', restUrl, uuid: page.params.uuid }
  }

  return { kind: 'community', restUrl, uuid: page.params.uuid }
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

    if ('feeds' in page) {
      return page.feeds.map((feed) => {
        return { uri: feed.uri, hint: composeHint(legacyKeys[page.kind], feed.format) }
      })
    }

    const root = page.restUrl

    if (page.kind === 'collection') {
      return [
        feeds.getFeedEntry('collection', { root, uuid: page.uuid }, 'atom'),
        feeds.getFeedEntry('collection', { root, uuid: page.uuid }, 'rss'),
        feeds.getFeedEntry('site', { root }, 'atom'),
        feeds.getFeedEntry('site', { root }, 'rss'),
      ]
    }

    if (page.kind === 'community') {
      return [
        feeds.getFeedEntry('community', { root, uuid: page.uuid }, 'atom'),
        feeds.getFeedEntry('community', { root, uuid: page.uuid }, 'rss'),
        feeds.getFeedEntry('site', { root }, 'atom'),
        feeds.getFeedEntry('site', { root }, 'rss'),
      ]
    }

    return [
      feeds.getFeedEntry('site', { root }, 'atom'),
      feeds.getFeedEntry('site', { root }, 'rss'),
    ]
  },
}

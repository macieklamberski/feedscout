import { isAnyOf, isHttpUrl, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getScriptText, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers community (html), partly covers collection.
// Handler needed for: home.

const scopePathRegex =
  /\/(collections|communities)\/([\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12})(?:\/|$)/i
const transferStateEntityRegex = /&([aglqs]);/g
const trailingSlashesRegex = /\/+$/

// Angular before 16 escapes the transfer state with these entities, and later versions print JSON.
const transferStateEntities: Record<string, string> = {
  a: '&',
  g: '>',
  l: '<',
  q: '"',
  s: "'",
}

type TransferState = {
  APP_CONFIG_STATE?: { rest?: { baseUrl?: unknown } }
}

export type DspacePage =
  | { kind: 'collection'; restUrl: string; uuid: string }
  | { kind: 'community'; restUrl: string; uuid: string }
  | { kind: 'home'; restUrl: string }

// The Angular UI of DSpace 7 and later renders every page inside this root element.
export const isDspaceHtml = (content: string): boolean => {
  return findElement(content, (element) => element.name === 'ds-app') !== undefined
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
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isDspaceHtml })
  },

  resolve: (url, content) => {
    const page = getDspacePage(url, content)

    if (!page) {
      return []
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

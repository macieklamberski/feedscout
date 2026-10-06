import { decodeSegment, resolveUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElements, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// Every OPUS 4 layout ships the core `frontdoorutil.js` under the install root, as in
// `/opus4/layouts/opus4-zwi2/js/frontdoorutil.js`, whatever the layout is named.
const assetRootRegex = /["']([^"'\s]*?)\/layouts\/[^/"'\s]+\/js\/frontdoorutil\.js/
const searchPathRegex = /^\/solrsearch\/index\/search\/(.+)$/i
const collectionIdRegex = /^\d+$/
const trailingSlashRegex = /\/$/
const urlencodeExtrasRegex = /[!'()*~]/g
const encodedSpaceRegex = /%20/g

// OPUS drops these from the search parameters when it prints the page's feed link.
const excludedParams = ['rows', 'start', 'sortfield', 'sortorder', 'browsing']

export type OpusPage = { kind: 'collection' | 'search'; feedUrl: string }

// OPUS spells its link parameters with PHP's `urlencode`, so `*:*` becomes `%2A%3A%2A`.
const encodeParam = (value: string): string => {
  return encodeURIComponent(value)
    .replace(urlencodeExtrasRegex, (character) => {
      return `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    })
    .replace(encodedSpaceRegex, '+')
}

// The platform method collapses `//` in the page url, which drops an empty facet and shifts the
// parameters after it, so the page's own feed link wins over the url built from the page url.
const getLinkedFeedUrl = (
  url: string,
  content: string | undefined,
  rootUrl: string,
): string | undefined => {
  const { host, pathname } = new URL(rootUrl)
  const feedPath = `${pathname.replace(trailingSlashRegex, '')}/rss/index/index/`
  const links = findElements(content ?? '', (element) => {
    return element.name === 'link' && element.attribs.rel === 'alternate'
  })

  for (const link of links) {
    const feedUrl = resolveUrl(link.attribs.href ?? '', url)

    if (!feedUrl) {
      continue
    }

    const { host: feedHost, pathname: feedPathname } = new URL(feedUrl)

    if (feedHost === host && feedPathname.startsWith(feedPath)) {
      return feedUrl
    }
  }
}

export const isOpusHtml = (content: string): boolean => {
  return assetRootRegex.test(content)
}

export const getOpusPage = (url: string, content?: string): OpusPage | undefined => {
  const assetRoot = content?.match(assetRootRegex)?.[1] ?? ''
  const { origin, pathname } = new URL(url)
  const rootPath = new URL(`${assetRoot}/`, url).pathname.replace(trailingSlashRegex, '')
  const searchPath = pathname.slice(rootPath.length).match(searchPathRegex)?.[1]

  if (!pathname.startsWith(rootPath) || !searchPath) {
    return
  }

  // Zend trims the path and reads its segments in pairs, so an empty facet keeps its place.
  const segments = searchPath.replace(trailingSlashRegex, '').split('/')
  const values: Record<string, string> = {}
  const params: Array<string> = []

  for (let index = 0; index < segments.length; index += 2) {
    const key = decodeSegment(segments[index])
    // Zend reads a `+` in a path parameter as a space.
    const value = decodeSegment(segments[index + 1]?.replaceAll('+', ' ') ?? '')

    if (key === undefined || value === undefined) {
      return
    }

    if (excludedParams.includes(key)) {
      continue
    }

    values[key] = value
    params.push(`${encodeParam(key)}/${encodeParam(value)}`)
  }

  const rootUrl = `${origin}${rootPath}`
  const feedUrl =
    getLinkedFeedUrl(url, content, rootUrl) ?? `${rootUrl}/rss/index/index/${params.join('/')}`

  if (values.searchtype === 'collection' && collectionIdRegex.test(values.id ?? '')) {
    return { kind: 'collection', feedUrl }
  }

  if (values.searchtype === 'simple' && values.query) {
    return { kind: 'search', feedUrl }
  }
}

export const opusHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isOpusHtml })) {
      return false
    }

    return getOpusPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getOpusPage(url, content)

    if (!page) {
      return []
    }

    if (page.kind === 'collection') {
      return [{ uri: page.feedUrl, hint: composeHint('opus:collection', 'rss') }]
    }

    return [{ uri: page.feedUrl, hint: composeHint('opus:search', 'rss') }]
  },
}

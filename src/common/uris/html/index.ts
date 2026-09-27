import { Parser } from 'htmlparser2'
import { isPlainObject, parseUrl } from 'trousse'
import { getJsonLd } from '../../utils.js'
import { createHtmlUrisHandlers } from './handlers.js'
import type { HtmlMethodContext, HtmlMethodOptions } from './types.js'

const jsonLdUriProperties = ['url', 'mainEntityOfPage', 'sameAs']

const isUriLike = (value: unknown): value is string => {
  return typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))
}

const extractJsonLdUris = (
  item: Record<string, unknown>,
  types: Array<string>,
  context: HtmlMethodContext,
): void => {
  const itemTypes = [item['@type']]
    .flat()
    .filter((type) => typeof type === 'string')
    .map((type) => type.toLowerCase())

  if (types.some((type) => itemTypes.includes(type.toLowerCase()))) {
    for (const property of jsonLdUriProperties) {
      for (const value of [item[property]].flat()) {
        if (isUriLike(value)) {
          context.discoveredUris.add(value)
        }
      }
    }

    // A DataFeed item describes the page itself as the feed.
    if (itemTypes.includes('datafeed') && context.options.baseUrl) {
      context.discoveredUris.add(context.options.baseUrl)
    }
  }

  if (Array.isArray(item['@graph'])) {
    for (const nested of item['@graph']) {
      if (isPlainObject(nested)) {
        extractJsonLdUris(nested, types, context)
      }
    }
  }
}

export const discoverUrisFromHtml = (html: string, options: HtmlMethodOptions): Array<string> => {
  const context: HtmlMethodContext = {
    discoveredUris: new Set<string>(),
    currentAnchor: { href: '', text: '' },
    options,
  }

  const handlers = createHtmlUrisHandlers(context)
  const parser = new Parser(handlers, { decodeEntities: true })

  parser.write(html)
  parser.end()

  if (options.jsonLdTypes?.length) {
    for (const item of getJsonLd(html).flat()) {
      if (isPlainObject(item)) {
        extractJsonLdUris(item, options.jsonLdTypes, context)
      }
    }
  }

  const uris = [...context.discoveredUris]

  // Resolve discovered URLs against <base href> when present (browser semantics). Without a
  // <base>, URLs are returned as-is and resolved downstream against the page URL.
  if (context.baseHref) {
    let base = context.baseHref

    if (options.baseUrl) {
      base = parseUrl(context.baseHref, options.baseUrl)?.href ?? options.baseUrl
    }

    return uris.map((uri) => parseUrl(uri, base)?.href ?? uri)
  }

  return uris
}

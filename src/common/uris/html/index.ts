import { Parser } from 'htmlparser2'
import { parseUrl } from 'trousse'
import { createHtmlUrisHandlers } from './handlers.js'
import type { HtmlMethodContext, HtmlMethodOptions } from './types.js'

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

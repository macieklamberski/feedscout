import { Parser } from 'htmlparser2'
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
    let base: string | undefined

    try {
      base = options.baseUrl ? new URL(context.baseHref, options.baseUrl).href : context.baseHref
    } catch {
      base = options.baseUrl
    }

    return uris.map((uri) => {
      try {
        return new URL(uri, base).href
      } catch {
        return uri
      }
    })
  }

  return uris
}

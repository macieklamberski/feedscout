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

  return Array.from(context.discoveredUris)
}

import { Parser } from 'htmlparser2'
import { createHtmlFeedUrisHandlers } from './handlers.js'
import type { HtmlDiscoveryOptions, HtmlFeedUrisContext } from './types.js'

export const discoverFeedUrisFromHtml = (
  html: string,
  options: HtmlDiscoveryOptions,
): Array<string> => {
  const context: HtmlFeedUrisContext = {
    discoveredUris: new Set<string>(),
    currentAnchor: { href: '', text: '' },
    options,
  }

  const handlers = createHtmlFeedUrisHandlers(context)
  const parser = new Parser(handlers, { decodeEntities: true })

  parser.write(html)
  parser.end()

  return Array.from(context.discoveredUris)
}

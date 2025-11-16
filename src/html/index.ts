import { Parser } from 'htmlparser2'
import type { HtmlDiscoveryOptions, HtmlFeedUrisContext } from './types.js'
import { createHtmlFeedUrisHandlers } from './utils.js'

export const discoverFeedUrisFromHtml = (
  html: string,
  options: HtmlDiscoveryOptions,
): Array<string> => {
  const context: HtmlFeedUrisContext = {
    discoveredUris: new Set<string>(),
    currentAnchor: { href: '', text: '' },
    options,
  }

  const parser = new Parser(createHtmlFeedUrisHandlers(context), { decodeEntities: true })

  parser.write(html)
  parser.end()

  return Array.from(context.discoveredUris)
}

import { Parser } from 'htmlparser2'
import type { HtmlDiscoveryOptions, HtmlFeedUrisContext } from '../common/types.js'
import { createHtmlFeedUrisHandlers } from '../common/utils.js'

export const discoverFeedUrisFromHtml = (html: string, options: HtmlDiscoveryOptions): Array<string> => {
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

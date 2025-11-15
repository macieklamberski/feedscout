import { Parser } from 'htmlparser2'
import type { DiscoverFeedUrisOptions, ParserContext } from '../common/types.js'
import { createHandlers } from '../common/utils.js'

export const discoverFeedUris = (html: string, options: DiscoverFeedUrisOptions): Array<string> => {
  const context: ParserContext = {
    discoveredUris: new Set<string>(),
    currentAnchor: { href: '', text: '' },
    options,
  }

  const parser = new Parser(createHandlers(context), { decodeEntities: true })

  parser.write(html)
  parser.end()

  return Array.from(context.discoveredUris)
}

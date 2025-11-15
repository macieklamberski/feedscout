import { Parser } from 'htmlparser2'
import type { DiscoverFeedsOptions, ParserContext } from '../common/types.js'
import { createHandlers } from '../common/utils.js'

export const discoverFeeds = (html: string, options: DiscoverFeedsOptions): Array<string> => {
  const context: ParserContext = {
    discoveredUrls: new Set<string>(),
    currentAnchor: { href: '', text: '' },
    options,
  }

  const parser = new Parser(createHandlers(context), { decodeEntities: true })

  parser.write(html)
  parser.end()

  return Array.from(context.discoveredUrls)
}

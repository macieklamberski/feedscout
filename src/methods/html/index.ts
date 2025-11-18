import { Parser } from 'htmlparser2'
import { createHtmlFeedUrisHandlers } from './handlers.js'
import type { Context, Options } from './types.js'

export const discoverFeedUrisFromHtml = (html: string, options: Options): Array<string> => {
  const context: Context = {
    discoveredUris: new Set<string>(),
    currentAnchor: { href: '', text: '' },
    options,
    baseUrl: options.baseUrl,
  }

  const handlers = createHtmlFeedUrisHandlers(context)
  const parser = new Parser(handlers, { decodeEntities: true })

  parser.write(html)
  parser.end()

  return Array.from(context.discoveredUris)
}

import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getMetaContent } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const trailingSlashRegex = /\/$/

const getBaseUrl = (origin: string, content: string): string => {
  const contextPath = getMetaContent(content, 'confluence-context-path') ?? ''

  return `${origin}${contextPath}`.replace(trailingSlashRegex, '')
}

export const isConfluenceHtml = (content: string): boolean => {
  return Boolean(getMetaContent(content, 'confluence-base-url'))
}

export const confluenceHandler: PlatformHandler = {
  match: (url, content) => {
    return Boolean(parseUrl(url)) && Boolean(content) && isConfluenceHtml(content ?? '')
  },

  resolve: (url, content) => {
    const { origin } = new URL(url)
    const baseUrl = getBaseUrl(origin, content ?? '')
    const spaceKey = getMetaContent(content ?? '', 'confluence-space-key')
    const uris: Array<DiscoverUriEntry> = []

    if (spaceKey) {
      uris.push({
        uri: `${baseUrl}/plugins/servlet/streams?key=${spaceKey}`,
        hint: composeHint('confluence:space'),
      })
    }

    uris.push({
      uri: `${baseUrl}/plugins/servlet/streams`,
      hint: composeHint('confluence:site'),
    })

    return uris
  },
}

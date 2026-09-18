import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, getMetaContent } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Confluence advertises its activity streams nowhere. They are served by a
// servlet at `{base}/plugins/servlet/streams`, optionally keyed to one space.
//
// Data Center only: Confluence Cloud renders client-side, serves no
// `confluence-*` meta, and its stream under `/wiki/` answers 404 or an HTML
// holding page without a session.
//
// The context path varies between `/confluence`, `/wiki` and none, so it is
// read from the page. `confluence-base-url` can name a different host than the
// one fetched, so the feed is built from the fetched origin instead.

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
    return URL.canParse(url) && Boolean(content) && isConfluenceHtml(content ?? '')
  },

  resolve: (url, content) => {
    try {
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
    } catch {}

    return []
  },
}

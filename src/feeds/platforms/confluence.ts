import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, composeQuery, getMetaContent, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const trailingSlashRegex = /\/$/

// The dashboard links this feed with an empty `spaces`, which answers no items. `conf_all` names
// every space.
const dashboardFeedQuery =
  'types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true'

const getBaseUrl = (origin: string, content: string): string => {
  const contextPath = getMetaContent(content, 'confluence-context-path') ?? ''

  return `${origin}${contextPath}`.replace(trailingSlashRegex, '')
}

export const isConfluenceHtml = (content: string): boolean => {
  return Boolean(getMetaContent(content, 'confluence-base-url'))
}

export const confluenceHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isConfluenceHtml })
  },

  resolve: (url, content) => {
    const { origin } = new URL(url)
    const baseUrl = getBaseUrl(origin, content ?? '')
    const spaceKey = getMetaContent(content ?? '', 'confluence-space-key')
    const uris: Array<DiscoverUriEntry> = []

    if (spaceKey) {
      uris.push({
        uri: `${baseUrl}/plugins/servlet/streams?${composeQuery({ key: spaceKey })}`,
        hint: composeHint('confluence:space'),
      })
    }

    uris.push({
      uri: `${baseUrl}/plugins/servlet/streams`,
      hint: composeHint('confluence:site'),
    })
    uris.push({
      uri: `${baseUrl}/spaces/createrssfeed.action?${dashboardFeedQuery}&rssType=rss2`,
      hint: composeHint('confluence:dashboard', 'rss'),
    })
    uris.push({
      uri: `${baseUrl}/spaces/createrssfeed.action?${dashboardFeedQuery}&rssType=atom`,
      hint: composeHint('confluence:dashboard', 'atom'),
    })

    return uris
  },
}

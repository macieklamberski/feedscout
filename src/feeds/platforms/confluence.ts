import { composeQuery } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getMetaContent, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const trailingSlashRegex = /\/$/

// The dashboard links this feed with an empty `spaces`, which answers no items. `conf_all` names
// every space.
const dashboardFeedQuery =
  'types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true'

export type ConfluencePage =
  | { kind: 'site'; baseUrl: string }
  | { kind: 'space'; baseUrl: string; spaceKey: string }

export const getConfluencePage = (url: string, content: string | undefined): ConfluencePage => {
  const contextPath = getMetaContent(content ?? '', 'confluence-context-path') ?? ''
  const baseUrl = `${new URL(url).origin}${contextPath}`.replace(trailingSlashRegex, '')
  const spaceKey = getMetaContent(content ?? '', 'confluence-space-key')

  if (!spaceKey) {
    return { kind: 'site', baseUrl }
  }

  return { kind: 'space', baseUrl, spaceKey }
}

export const isConfluenceHtml = (content: string): boolean => {
  return Boolean(getMetaContent(content, 'confluence-base-url'))
}

export const confluenceHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isConfluenceHtml })
  },

  resolve: (url, content) => {
    const page = getConfluencePage(url, content)
    const { baseUrl } = page
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'space') {
      uris.push({
        uri: `${baseUrl}/plugins/servlet/streams${composeQuery({ key: page.spaceKey })}`,
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

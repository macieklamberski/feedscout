import { confluence } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const trailingSlashRegex = /\/$/

const feeds = withHintLabels(confluence.feeds)

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
    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    const params = { root: page.baseUrl }

    if (page.kind === 'space') {
      return [
        pageFeeds.getFeedEntry('confluence:space', { ...params, spaceKey: page.spaceKey }),
        pageFeeds.getFeedEntry('confluence:site', params),
        pageFeeds.getFeedEntry('confluence:dashboard', params, 'rss'),
        pageFeeds.getFeedEntry('confluence:dashboard', params, 'atom'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('confluence:site', params),
      pageFeeds.getFeedEntry('confluence:dashboard', params, 'rss'),
      pageFeeds.getFeedEntry('confluence:dashboard', params, 'atom'),
    ]
  },
}

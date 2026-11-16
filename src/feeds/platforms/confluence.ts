import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const trailingSlashRegex = /\/$/

// A site runs on its own domain, under its context path, and is known only by its marker, so its
// feeds are built here but not claimed. The dashboard links its feed with an empty `spaces`, which
// answers no items, and `conf_all` names every space. Its query is written as a form, as the
// dashboard writes it, while a space key keeps its `~` in the stream feeds.
const feeds = definePlatformFeeds([
  { key: 'confluence:space', template: '{root}/plugins/servlet/streams?key={spaceKey}' },
  { key: 'confluence:site', template: '{root}/plugins/servlet/streams' },
  {
    key: 'confluence:dashboard',
    template:
      '{root}/spaces/createrssfeed.action?types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true&rssType=rss2',
    format: 'rss',
    queryEncoding: 'form',
  },
  {
    key: 'confluence:dashboard',
    template:
      '{root}/spaces/createrssfeed.action?types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true&rssType=atom',
    format: 'atom',
    queryEncoding: 'form',
  },
])

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

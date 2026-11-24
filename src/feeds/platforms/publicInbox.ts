import { publicInbox } from 'feedintel'
import { getPathSegments, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getSiteParams, getSiteUrl, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PublicInboxPage =
  | { kind: 'inbox'; inboxUrl: string }
  | { kind: 'message'; inboxUrl: string; messageId: string }

// The core navigation links help relative to the page, one `../` per level below the inbox root.
const helpLinkRegex = /href="((?:\.\.\/)*)_\/text\/help\/?"/i

const feeds = withHintLabels(publicInbox.feeds)

export const isPublicInboxHtml = (content: string): boolean => {
  return helpLinkRegex.test(content) && content.includes('_/text/color')
}

// The inbox of a page on any host sits as many levels above the page as its help link climbs.
const readHostedPage = (url: string, content: string) => {
  const segments = getPathSegments(url)
  const upLevels = helpLinkRegex.exec(content)?.[1] ?? ''
  const rootLength = segments.length - upLevels.length / 3

  if (rootLength < 0) {
    return
  }

  return publicInbox.pages.read(url, { base: segments.slice(0, rootLength) })
}

export const getPublicInboxPage = (url: string, content?: string): PublicInboxPage | undefined => {
  const parsedUrl = parseUrl(url)
  const page =
    content && isPublicInboxHtml(content)
      ? readHostedPage(url, content)
      : publicInbox.pages.read(url)

  if (!parsedUrl || !page) {
    return
  }

  const { inbox, base } = page.params
  const scheme = parsedUrl.protocol.slice(0, -1)
  const inboxUrl = `${getSiteUrl({ scheme, host: parsedUrl.host, base: inbox ? [inbox] : base })}/`

  if (page.key === 'message') {
    return { kind: 'message', inboxUrl, messageId: page.params.messageId }
  }

  return { kind: 'inbox', inboxUrl }
}

export const publicInboxHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!publicInbox.pages.read(url) && !hasMarker(content, headers, { html: isPublicInboxHtml })) {
      return false
    }

    return getPublicInboxPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getPublicInboxPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const site = getSiteParams(page.inboxUrl)

    if (page.kind === 'message') {
      const params = { ...site, messageId: page.messageId }

      return [pageFeeds.getFeedEntry('thread', params), pageFeeds.getFeedEntry('messages', site)]
    }

    return [pageFeeds.getFeedEntry('messages', site)]
  },

  getFeedHint: feeds.getFeedHint,
}

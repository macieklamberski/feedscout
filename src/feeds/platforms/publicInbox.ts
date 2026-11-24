import { publicInbox } from 'feedintel'
import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getSiteParams, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PublicInboxPage =
  | { kind: 'inbox'; inboxUrl: string }
  | { kind: 'message'; inboxUrl: string; messageId: string }

const hosts = publicInbox.hosts.exact

// A file at the root, such as the list of inboxes, is no inbox.
const fileRegex = /\.(?:html?|txt|json|xml|ico)$/i

// The core navigation links help relative to the page, one `../` per level below the inbox root.
const helpLinkRegex = /href="((?:\.\.\/)*)_\/text\/help\/?"/i

const feeds = withHintLabels(publicInbox.feeds)

export const isPublicInboxHtml = (content: string): boolean => {
  return helpLinkRegex.test(content) && content.includes('_/text/color')
}

export const getPublicInboxPage = (url: string, content?: string): PublicInboxPage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const segments = getPathSegments(url)
  let rootLength: number

  if (content && isPublicInboxHtml(content)) {
    const upLevels = content.match(helpLinkRegex)?.[1] ?? ''
    rootLength = segments.length - upLevels.length / 3
  } else if (isHostOf(url, hosts) && segments.length > 0) {
    rootLength = 1
  } else {
    return
  }

  const inboxSegments = segments.slice(0, rootLength)

  if (rootLength < 0 || fileRegex.test(inboxSegments.at(-1) ?? '')) {
    return
  }

  const inboxPath = inboxSegments.map((segment) => `${segment}/`).join('')
  const inboxUrl = `${parsedUrl.origin}/${inboxPath}`
  const [messageId] = segments.slice(rootLength)

  // Every Message-ID carries an `@`, and no route segment of an inbox does.
  if (messageId?.includes('@')) {
    return { kind: 'message', inboxUrl, messageId }
  }

  return { kind: 'inbox', inboxUrl }
}

export const publicInboxHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!isHostOf(url, hosts) && !hasMarker(content, headers, { html: isPublicInboxHtml })) {
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

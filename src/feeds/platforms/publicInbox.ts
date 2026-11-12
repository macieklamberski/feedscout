import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PublicInboxPage =
  | { kind: 'inbox'; inboxUrl: string }
  | { kind: 'message'; inboxUrl: string; messageId: string }

// lore.kernel.org answers a page request from a browser user agent with an Anubis challenge, and
// from curl with 403, while its feeds still answer.
const hosts = ['lore.kernel.org']

// A file at the root, such as the list of inboxes, is no inbox.
const fileRegex = /\.(?:html?|txt|json|xml|ico)$/i

// The core navigation links help relative to the page, one `../` per level below the inbox root.
const helpLinkRegex = /href="((?:\.\.\/)*)_\/text\/help\/?"/i

const feeds = definePlatformFeeds([
  { key: 'public-inbox:messages', template: 'https://lore.kernel.org/{inbox}/new.atom' },
  { key: 'public-inbox:thread', template: 'https://lore.kernel.org/{inbox}/{messageId}/t.atom' },
])

// An inbox can sit at any depth below its host, so its feeds are built under the inbox URL as the
// root. A self-hosted inbox has nothing in its URL that names the software, so these are not
// claimed.
const inboxFeeds = definePlatformFeeds([
  { key: 'public-inbox:messages', template: '{root}/new.atom' },
  { key: 'public-inbox:thread', template: '{root}/{messageId}/t.atom' },
])

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
    const pageFeeds = inboxFeeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const root = page.inboxUrl
    const inboxEntry = pageFeeds.getFeedEntry('public-inbox:messages', { root })

    if (page.kind === 'message') {
      const params = { root, messageId: page.messageId }

      return [pageFeeds.getFeedEntry('public-inbox:thread', params), inboxEntry]
    }

    return [inboxEntry]
  },

  getFeedHint: feeds.getFeedHint,
}

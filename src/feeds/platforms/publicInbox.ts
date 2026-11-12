import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

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

// A self-hosted inbox can sit at any depth below its host, which no row holds, so its feeds are
// built from the inbox URL and not claimed.
const feeds = definePlatformFeeds([
  { key: 'public-inbox:messages', template: 'https://lore.kernel.org/{inbox}/new.atom' },
  { key: 'public-inbox:thread', template: 'https://lore.kernel.org/{inbox}/{messageId}/t.atom' },
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

    if (!page) {
      return []
    }

    const inboxSegments = getPathSegments(page.inboxUrl)

    if (inboxSegments.length === 1 && isHostOf(page.inboxUrl, hosts)) {
      const [inbox] = inboxSegments
      const inboxEntry = feeds.getFeedEntry('public-inbox:messages', { inbox })

      if (page.kind === 'message') {
        const params = { inbox, messageId: page.messageId }

        return [feeds.getFeedEntry('public-inbox:thread', params), inboxEntry]
      }

      return [inboxEntry]
    }

    const inboxFeed: DiscoverUriEntry = {
      uri: `${page.inboxUrl}new.atom`,
      hint: composeHint('public-inbox:messages'),
    }

    if (page.kind === 'message') {
      return [
        {
          uri: `${page.inboxUrl}${page.messageId}/t.atom`,
          hint: composeHint('public-inbox:thread'),
        },
        inboxFeed,
      ]
    }

    return [inboxFeed]
  },

  getFeedHint: feeds.getFeedHint,
}

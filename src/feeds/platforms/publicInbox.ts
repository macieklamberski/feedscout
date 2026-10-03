import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// lore.kernel.org answers a page request from a browser user agent with an Anubis challenge, and
// from curl with 403, while its feeds still answer.
const hosts = ['lore.kernel.org']

// The core navigation links help relative to the page, one `../` per level below the inbox root.
const helpLinkRegex = /href="((?:\.\.\/)*)_\/text\/help\/?"/

export type PublicInboxPage =
  | { kind: 'inbox'; inboxUrl: string }
  | { kind: 'message'; inboxUrl: string; messageId: string }

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

  if (rootLength < 0) {
    return
  }

  const inboxPath = segments
    .slice(0, rootLength)
    .map((segment) => `${segment}/`)
    .join('')
  const inboxUrl = `${parsedUrl.origin}/${inboxPath}`
  const messageId = segments[rootLength]

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
}

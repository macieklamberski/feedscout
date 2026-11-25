import { publicInbox } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PublicInboxPage =
  | { kind: 'inbox'; params: PublicInboxParams }
  | { kind: 'message'; params: PublicInboxParams; messageId: string }

// The inbox an inbox's feeds are built from: its name on lore.kernel.org, its folder elsewhere.
type PublicInboxParams = { inbox?: string; base?: Array<string> }

// The core navigation links help relative to the page, one `../` per level below the inbox root.
const helpLinkRegex = /href="((?:\.\.\/)*)_\/text\/help\/?"/i

const feeds = withHintLabels(publicInbox.feeds)

export const isPublicInboxHtml = (content: string): boolean => {
  return helpLinkRegex.test(content) && content.includes('_/text/color')
}

// The inbox of a page on any host is the folder of the help page it links.
const readHostedPage = (url: string, content: string) => {
  const helpLink = findElement(content, (element) => {
    const helpUrl = parseUrl(element.attribs.href, url)?.href ?? ''

    return (
      element.name === 'a' &&
      publicInbox.pages.readUrl(helpUrl, { isAnyHost: true })?.key === 'help'
    )
  })
  const helpUrl = parseUrl(helpLink?.attribs.href, url)?.href ?? ''
  const help = publicInbox.pages.readUrl(helpUrl, { isAnyHost: true })

  if (help?.key !== 'help') {
    return
  }

  return publicInbox.pages.readUrl(url, { base: help.values.base ?? [] })
}

export const getPublicInboxPage = (url: string, content?: string): PublicInboxPage | undefined => {
  const page =
    content && isPublicInboxHtml(content)
      ? readHostedPage(url, content)
      : publicInbox.pages.readUrl(url)

  if (!page) {
    return
  }

  // Only a lore.kernel.org row names the inbox, and a help page is read in its inbox's folder.
  const inbox = 'inbox' in page.values ? page.values.inbox : undefined
  const params = { inbox, base: page.values.base }

  if (page.key === 'message') {
    return { kind: 'message', params, messageId: page.values.messageId }
  }

  return { kind: 'inbox', params }
}

export const publicInboxHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (
      !publicInbox.pages.readUrl(url) &&
      !hasMarker(content, headers, { html: isPublicInboxHtml })
    ) {
      return false
    }

    return getPublicInboxPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getPublicInboxPage(url, content)
    const pageFeeds = feeds.forSite(url)

    if (!page || !pageFeeds) {
      return []
    }

    if (page.kind === 'message') {
      const params = { ...page.params, messageId: page.messageId }

      return [
        pageFeeds.getFeedEntry('thread', params),
        pageFeeds.getFeedEntry('messages', page.params),
      ]
    }

    return [pageFeeds.getFeedEntry('messages', page.params)]
  },

  getFeedHint: feeds.getFeedHint,
}

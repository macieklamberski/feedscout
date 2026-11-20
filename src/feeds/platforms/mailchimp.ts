import { mailchimp } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type MailchimpUrl =
  | { kind: 'archive'; userId: string; listId: string }
  | { kind: 'campaign'; userId: string }
export type MailchimpPage = { kind: 'archive' | 'campaign'; userId: string; listId: string }

// A campaign page links its archive and feed, whose id is the list the campaign went to.
const listLinkRegex = /campaign-archive\.com\/(?:home\/|feed)\?u=\w+&(?:amp;)?id=(?<listId>\w+)/i

const feeds = withHintLabels(mailchimp.feeds)

export const parseMailchimpUrl = (url: string): MailchimpUrl | undefined => {
  const page = mailchimp.pages.read(url)

  if (!page) {
    return
  }

  const { userId, listId } = page.params

  if (page.key === 'archive') {
    return { kind: 'archive', userId, listId }
  }

  // Outside the archive page the id names one campaign, which has no feed.
  return { kind: 'campaign', userId }
}

export const getMailchimpPage = (
  url: string,
  content: string | undefined,
): MailchimpPage | undefined => {
  const parsed = parseMailchimpUrl(url)

  if (!parsed) {
    return
  }

  if (parsed.kind === 'archive') {
    return parsed
  }

  const listId = content?.match(listLinkRegex)?.groups?.listId

  if (!listId) {
    return
  }

  return { kind: 'campaign', userId: parsed.userId, listId }
}

export const mailchimpHandler: PlatformHandler = {
  match: (url) => {
    return parseMailchimpUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getMailchimpPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const params = {
      userId: page.userId,
      listId: page.listId,
    }

    return [pageFeeds.getFeedEntry('archive', params)]
  },

  getFeedHint: feeds.getFeedHint,
}

import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, composeQuery } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type MailchimpUrl =
  | { kind: 'archive'; userId: string; listId: string }
  | { kind: 'campaign'; userId: string }

const domains = ['campaign-archive.com']

const archivePathRegex = /^\/home\/?$/i
// A campaign page links its archive and feed, whose id is the list the campaign went to.
const listLinkRegex = /campaign-archive\.com\/(?:home\/|feed)\?u=\w+&(?:amp;)?id=(?<listId>\w+)/i

export const parseMailchimpUrl = (url: string): MailchimpUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  const { pathname, searchParams } = new URL(url)
  const userId = searchParams.get('u')
  const id = searchParams.get('id')

  if (!userId || !id) {
    return
  }

  if (archivePathRegex.test(pathname)) {
    return { kind: 'archive', userId, listId: id }
  }

  // Outside the archive page the id names one campaign, which has no feed.
  return { kind: 'campaign', userId }
}

export const mailchimpHandler: PlatformHandler = {
  match: (url) => {
    return parseMailchimpUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseMailchimpUrl(url)

    if (!parsed) {
      return []
    }

    const listId =
      parsed.kind === 'archive' ? parsed.listId : content?.match(listLinkRegex)?.groups?.listId

    if (!listId) {
      return []
    }

    const { origin } = new URL(url)

    return [
      {
        uri: `${origin}/feed?${composeQuery({ u: parsed.userId, id: listId })}`,
        hint: composeHint('mailchimp:archive'),
      },
    ]
  },
}

import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type MailchimpUrl =
  | { kind: 'archive'; userId: string; listId: string }
  | { kind: 'campaign'; userId: string }
export type MailchimpPage = { kind: 'archive' | 'campaign'; userId: string; listId: string }

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

    if (!page) {
      return []
    }

    const { origin } = new URL(url)

    return [
      {
        uri: `${origin}/feed?u=${page.userId}&id=${page.listId}`,
        hint: composeHint('mailchimp:archive'),
      },
    ]
  },
}

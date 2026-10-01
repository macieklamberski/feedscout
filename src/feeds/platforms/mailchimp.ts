import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Unmeasured, no public page.

export type MailchimpUrl = { kind: 'archive'; userId: string; listId: string }

const domains = ['campaign-archive.com']

export const parseMailchimpUrl = (url: string): MailchimpUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  const { searchParams } = new URL(url)
  const userId = searchParams.get('u')
  const listId = searchParams.get('id')

  if (!userId || !listId) {
    return
  }

  return { kind: 'archive', userId, listId }
}

export const mailchimpHandler: PlatformHandler = {
  match: (url) => {
    return parseMailchimpUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMailchimpUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [
      {
        uri: `${origin}/feed?u=${parsed.userId}&id=${parsed.listId}`,
        hint: composeHint('mailchimp:archive'),
      },
    ]
  },
}

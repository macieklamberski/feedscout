import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Unmeasured, no public page.

const domains = ['campaign-archive.com']

export const mailchimpHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, domains)) {
      return false
    }

    const { searchParams } = new URL(url)

    return Boolean(searchParams.get('u') && searchParams.get('id'))
  },

  resolve: (url) => {
    const { origin, searchParams } = new URL(url)
    const user = searchParams.get('u')
    const id = searchParams.get('id')

    if (!user || !id) {
      return []
    }

    return [
      {
        uri: `${origin}/feed?u=${user}&id=${id}`,
        hint: composeHint('mailchimp:archive'),
      },
    ]
  },
}

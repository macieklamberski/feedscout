import { isSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Unmeasured, no public page.

export const mailchimpHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, 'campaign-archive.com')) {
      return false
    }

    const { searchParams } = new URL(url)

    return Boolean(searchParams.get('u') && searchParams.get('id'))
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin, searchParams } = parsedUrl
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

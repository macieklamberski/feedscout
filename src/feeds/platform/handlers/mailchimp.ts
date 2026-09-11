import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// A Mailchimp campaign archive serves RSS at `/feed?u={u}&id={id}`. The archive
// home page links it; a single-campaign URL does not, and that is where the
// handler earns its place.
//
// The datacentre prefix such as `us17` is part of the host and cannot be
// derived, so both it and the two ids come from the input URL.

export const mailchimpHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, 'campaign-archive.com')) {
      return false
    }

    const { searchParams } = new URL(url)

    return Boolean(searchParams.get('u') && searchParams.get('id'))
  },

  resolve: (url) => {
    try {
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
    } catch {}

    return []
  },
}

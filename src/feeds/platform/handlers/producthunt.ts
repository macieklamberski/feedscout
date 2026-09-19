import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Product Hunt publishes a single global Atom firehose at
// `producthunt.com/feed`. Topic and category pages have no per-slug feed,
// and `?topic=` and `?category=` are ignored: fetched in one round, the bare
// URL and both query forms carry the same 50 items. The feed itself changes
// minute to minute, so two fetches apart in time always differ.

const hosts = ['producthunt.com', 'www.producthunt.com']

export const producthuntHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: () => {
    return [
      {
        uri: 'https://www.producthunt.com/feed',
        hint: composeHint('producthunt:products'),
      },
    ]
  },
}

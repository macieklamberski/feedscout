import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { wordpressHandler } from './wordpress.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

const domains = ['wpenginepowered.com', 'wpengine.com']

export const wpengineHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, domains)
  },
  resolve: wordpressHandler.resolve,
}

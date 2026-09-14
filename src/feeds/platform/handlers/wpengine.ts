import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { wordpressHandler } from './wordpress.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: all shapes.

export const wpengineHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, ['wpenginepowered.com', 'wpengine.com'])
  },
  resolve: wordpressHandler.resolve,
}

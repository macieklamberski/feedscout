import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { wordpressHandler } from './wordpress.js'

// Discoverability: Discoverable without handler.
//
// WP Engine is managed WordPress hosting; customer sandbox sites at
// `{env}.wpenginepowered.com` (current) and `{env}.wpengine.com` (legacy)
// serve the stock WordPress feed surface (`/feed/`, `/comments/feed/`,
// category/tag/author/date archives, with RSS+Atom+RDF and `/?feed=` query
// fallbacks) and HTML autodiscovery just works. The handler exists to
// recognise those hosts and delegate to `wordpressHandler.resolve`.

export const wpengineHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, ['wpenginepowered.com', 'wpengine.com'])
  },
  resolve: wordpressHandler.resolve,
}

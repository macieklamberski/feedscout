import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isSubdomainOf } from '../../../common/utils.js'
import { wordpressHandler } from './wordpress.js'

export const wpengineHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, ['wpenginepowered.com', 'wpengine.com'])
  },
  resolve: wordpressHandler.resolve,
}

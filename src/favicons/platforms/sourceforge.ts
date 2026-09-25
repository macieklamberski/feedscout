import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseSourceforgeUrl } from '../../feeds/platforms/sourceforge.js'

export const sourceforgeHandler: PlatformHandler = {
  match: (url) => {
    return parseSourceforgeUrl(url) !== undefined
  },

  resolve: (url) => {
    const project = parseSourceforgeUrl(url)?.project

    if (!project) {
      return []
    }

    return [{ uri: `https://a.fsdn.com/allura/p/${project}/icon` }]
  },
}

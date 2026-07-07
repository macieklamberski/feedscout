import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { hosts } from '../../../feeds/platform/handlers/sourceforge.js'

export const sourceforgeHandler: PlatformHandler = {
  match: (url) => {
    try {
      const { pathname } = new URL(url)
      const segments = pathname.split('/').filter(Boolean)

      return isHostOf(url, hosts) && segments[0] === 'projects' && !!segments[1]
    } catch {}

    return false
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const segments = pathname.split('/').filter(Boolean)

    if (segments[0] !== 'projects' || !segments[1]) {
      return []
    }

    const project = segments[1]

    return [{ uri: `https://a.fsdn.com/allura/p/${project}/icon` }]
  },
}

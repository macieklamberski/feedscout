import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

const hosts = ['sourceforge.net', 'www.sourceforge.net']

export const sourceforgeHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Project page: sourceforge.net/projects/{project}
    if (pathSegments[0] === 'projects' && pathSegments[1]) {
      const project = pathSegments[1]

      return [
        {
          uri: `${origin}/projects/${project}/rss`,
          hint: composeHint('sourceforge:activity'),
        },
      ]
    }

    return []
  },
}

import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

export const hosts = ['sourceforge.net', 'www.sourceforge.net']

export const sourceforgeHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Project pages can be at either /projects/{project} or /p/{project}.
    const isProject = (pathSegments[0] === 'projects' || pathSegments[0] === 'p') && pathSegments[1]

    if (isProject) {
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

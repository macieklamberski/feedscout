import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getGiteaPage, giteaHandler as giteaFeedHandler } from '../../feeds/platforms/gitea.js'

export const giteaHandler: PlatformHandler = {
  match: giteaFeedHandler.match,

  resolve: (url, content) => {
    const page = getGiteaPage(url, content)

    if (!page) {
      return []
    }

    return [{ uri: `${page.root}/user/avatar/${page.owner}/512` }]
  },
}

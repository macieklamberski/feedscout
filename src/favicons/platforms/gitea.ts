import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { giteaHandler as giteaFeedHandler, parseGiteaUrl } from '../../feeds/platforms/gitea.js'

export const giteaHandler: PlatformHandler = {
  match: giteaFeedHandler.match,

  resolve: (url) => {
    const { origin } = new URL(url)
    const owner = parseGiteaUrl(url)?.owner

    if (!owner) {
      return []
    }

    return [{ uri: `${origin}/user/avatar/${owner}/512` }]
  },
}

import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hosts } from '../../feeds/platforms/steam.js'

const appPathRegex = /^\/app\/\d+/
const appIconRegex = /class="apphub_AppIcon">\s*<img src="([^"]+)"/

export const steamHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    return isHostOf(url, hosts) && appPathRegex.test(parsedUrl.pathname)
  },

  resolve: (_url, content) => {
    const appIconMatch = content?.match(appIconRegex)

    if (!appIconMatch?.[1]) {
      return []
    }

    return [{ uri: appIconMatch[1] }]
  },
}

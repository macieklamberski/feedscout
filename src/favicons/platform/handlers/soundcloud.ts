import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/soundcloud.js'

const avatarRegex =
  /<meta\s+property="og:image"\s+content="(https:\/\/i\d+\.sndcdn\.com\/avatars-[^"]+)"/

export const soundcloudHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHostOf(url, hosts)) {
      return false
    }

    const [user, section, ...rest] = parsedUrl.pathname.split('/').filter(Boolean)

    if (!user || isAnyOf(user, excludedPaths) || rest.length > 0) {
      return false
    }

    return !section || section === 'tracks'
  },

  resolve: (_url, content) => {
    const avatarUrl = content?.match(avatarRegex)?.[1]

    if (!avatarUrl) {
      return []
    }

    return [{ uri: avatarUrl }]
  },
}

import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { excludedPaths, hosts } from '../../feeds/platforms/soundcloud.js'

const avatarUrlRegex = /^https:\/\/i\d+\.sndcdn\.com\/avatars-/

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
    const avatarUrl = getMetaContent(content ?? '', 'og:image')

    if (!avatarUrl || !avatarUrlRegex.test(avatarUrl)) {
      return []
    }

    return [{ uri: avatarUrl }]
  },
}

import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { soundcloudHandler as soundcloudFeedHandler } from '../../feeds/platforms/soundcloud.js'

// A track or playlist with its own artwork carries an artworks- image instead.
const avatarUrlRegex = /^https:\/\/i\d+\.sndcdn\.com\/avatars-/

export const soundcloudHandler: PlatformHandler = {
  match: soundcloudFeedHandler.match,

  resolve: (_url, content) => {
    const avatarUrl = getMetaContent(content ?? '', 'og:image')

    if (!avatarUrl || !avatarUrlRegex.test(avatarUrl)) {
      return []
    }

    return [{ uri: avatarUrl }]
  },
}

import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  microblogHandler as microblogFeedHandler,
  parseMicroblogUrl,
} from '../../feeds/platforms/microblog.js'

export const microblogHandler: PlatformHandler = {
  match: microblogFeedHandler.match,

  resolve: (url) => {
    const username = parseMicroblogUrl(url)?.username

    if (!username) {
      return []
    }

    return [{ uri: `https://micro.blog/${username}/avatar.jpg` }]
  },
}

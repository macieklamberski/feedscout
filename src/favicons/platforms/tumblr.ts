import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseTumblrUrl, tumblrHandler as tumblrFeedHandler } from '../../feeds/platforms/tumblr.js'

export const tumblrHandler: PlatformHandler = {
  match: tumblrFeedHandler.match,

  resolve: (url) => {
    const blog = parseTumblrUrl(url)?.blog

    if (!blog) {
      return []
    }

    return [{ uri: `https://api.tumblr.com/v2/blog/${blog}/avatar/512` }]
  },
}

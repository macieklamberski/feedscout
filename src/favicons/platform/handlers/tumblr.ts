import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isSubdomainOf } from '../../../common/utils.js'
import { domains } from '../../../feeds/platform/handlers/tumblr.js'

export const tumblrHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, domains)
  },

  resolve: (url) => {
    const { hostname } = new URL(url)
    const blog = hostname.split('.')[0]

    if (!blog) {
      return []
    }

    return [{ uri: `https://api.tumblr.com/v2/blog/${blog}/avatar/512` }]
  },
}

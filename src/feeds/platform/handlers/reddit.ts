import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf } from '../../../common/utils.js'

const hosts = ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'new.reddit.com']

export const redditHandler: PlatformHandler = {
  match: (url) => {
    return isAnyOf(new URL(url).hostname, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Match /r/subreddit pattern.
    const subredditMatch = pathname.match(/^\/r\/([^/]+)/)

    if (subredditMatch?.[1]) {
      const subreddit = subredditMatch[1]

      return [`https://www.reddit.com/r/${subreddit}/.rss`]
    }

    // Match /u/username or /user/username pattern.
    const userMatch = pathname.match(/^\/(u|user)\/([^/]+)/)

    if (userMatch?.[2]) {
      const username = userMatch[2]

      return [`https://www.reddit.com/user/${username}/.rss`]
    }

    return []
  },
}

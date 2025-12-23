import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'

const hosts = ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'new.reddit.com']
const sortOptions = ['hot', 'new', 'rising', 'controversial', 'top']

// Note: Reddit also supports these feed formats which require user input:
// - Time-filtered top/controversial: /r/{sub}/top/.rss?t=week (hour|day|week|month|year|all)
// - Combined subreddits: /r/{sub1}+{sub2}/.rss

export const redditHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Homepage: reddit.com/
    if (pathSegments.length === 0) {
      return ['https://www.reddit.com/.rss']
    }

    // Match /r/subreddit/comments/id pattern (post comments feed).
    const commentsMatch = pathname.match(/^\/r\/([^/]+)\/comments\/([^/]+)/)

    if (commentsMatch?.[1] && commentsMatch?.[2]) {
      const subreddit = commentsMatch[1]
      const postId = commentsMatch[2]

      return [`https://www.reddit.com/r/${subreddit}/comments/${postId}/.rss`]
    }

    // Match /r/subreddit with optional sort.
    const subredditMatch = pathname.match(/^\/r\/([^/]+)(?:\/([^/]+))?/)

    if (subredditMatch?.[1]) {
      const subreddit = subredditMatch[1]
      const sort = subredditMatch[2]
      const uris: Array<string> = []

      if (sort && isAnyOf(sort, sortOptions)) {
        uris.push(`https://www.reddit.com/r/${subreddit}/${sort}/.rss`)
      } else {
        uris.push(`https://www.reddit.com/r/${subreddit}/.rss`)
      }

      // Add all comments feed for subreddit.
      uris.push(`https://www.reddit.com/r/${subreddit}/comments/.rss`)

      return uris
    }

    // Match multireddit: /user/{username}/m/{multireddit}.
    const multiredditMatch = pathname.match(/^\/user\/([^/]+)\/m\/([^/]+)/)

    if (multiredditMatch?.[1] && multiredditMatch?.[2]) {
      const username = multiredditMatch[1]
      const multireddit = multiredditMatch[2]

      return [`https://www.reddit.com/user/${username}/m/${multireddit}/.rss`]
    }

    // Match /u/username or /user/username pattern.
    const userMatch = pathname.match(/^\/(u|user)\/([^/]+)/)

    if (userMatch?.[2]) {
      const username = userMatch[2]

      return [`https://www.reddit.com/user/${username}/.rss`]
    }

    // Match /domain/site pattern.
    const domainMatch = pathname.match(/^\/domain\/([^/]+)/)

    if (domainMatch?.[1]) {
      const domain = domainMatch[1]

      return [`https://www.reddit.com/domain/${domain}/.rss`]
    }

    return []
  },
}

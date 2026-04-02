import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

const commentsPattern = /^\/r\/([^/]+)\/comments\/([^/]+)/
const subredditPattern = /^\/r\/([^/]+)(?:\/([^/]+))?/
const multiredditPattern = /^\/user\/([^/]+)\/m\/([^/]+)/
const userPattern = /^\/(u|user)\/([^/]+)/
const domainPattern = /^\/domain\/([^/]+)/

export const hosts = ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'new.reddit.com']
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
      return [{ uri: 'https://www.reddit.com/.rss', hint: composeHint('reddit:posts') }]
    }

    // Match /r/subreddit/comments/id pattern (post comments feed).
    const commentsMatch = pathname.match(commentsPattern)

    if (commentsMatch?.[1] && commentsMatch?.[2]) {
      const subreddit = commentsMatch[1]
      const postId = commentsMatch[2]

      return [
        {
          uri: `https://www.reddit.com/r/${subreddit}/comments/${postId}/.rss`,
          hint: composeHint('reddit:post-comments'),
        },
      ]
    }

    // Match /r/subreddit with optional sort.
    const subredditMatch = pathname.match(subredditPattern)

    if (subredditMatch?.[1]) {
      const subreddit = subredditMatch[1]
      const sort = subredditMatch[2]
      const uris: Array<DiscoverUriEntry> = []

      if (sort && isAnyOf(sort, sortOptions)) {
        uris.push({
          uri: `https://www.reddit.com/r/${subreddit}/${sort}/.rss`,
          hint: composeHint('reddit:posts'),
        })
      } else {
        uris.push({
          uri: `https://www.reddit.com/r/${subreddit}/.rss`,
          hint: composeHint('reddit:posts'),
        })
      }

      // Add all comments feed for subreddit.
      uris.push({
        uri: `https://www.reddit.com/r/${subreddit}/comments/.rss`,
        hint: composeHint('reddit:comments'),
      })

      return uris
    }

    // Match multireddit: /user/{username}/m/{multireddit}.
    const multiredditMatch = pathname.match(multiredditPattern)

    if (multiredditMatch?.[1] && multiredditMatch?.[2]) {
      const username = multiredditMatch[1]
      const multireddit = multiredditMatch[2]

      return [
        {
          uri: `https://www.reddit.com/user/${username}/m/${multireddit}/.rss`,
          hint: composeHint('reddit:multireddit'),
        },
      ]
    }

    // Match /u/username or /user/username pattern.
    const userMatch = pathname.match(userPattern)

    if (userMatch?.[2]) {
      const username = userMatch[2]

      return [
        {
          uri: `https://www.reddit.com/user/${username}/.rss`,
          hint: composeHint('reddit:posts'),
        },
      ]
    }

    // Match /domain/site pattern.
    const domainMatch = pathname.match(domainPattern)

    if (domainMatch?.[1]) {
      const domain = domainMatch[1]

      return [
        {
          uri: `https://www.reddit.com/domain/${domain}/.rss`,
          hint: composeHint('reddit:posts'),
        },
      ]
    }

    return []
  },
}

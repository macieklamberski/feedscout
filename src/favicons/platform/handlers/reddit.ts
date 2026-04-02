import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'
import { hosts } from '../../../feeds/platform/handlers/reddit.js'
import { isNonEmptyString, parseBodyJson } from '../../utils.js'

// Extracts the subreddit or username from the path, excluding dots to avoid
// capturing feed extensions like .rss in Reddit feed URLs (e.g., /r/sub.rss).
const subredditPathRegex = /^\/r\/([^/.]+)/
const userPathRegex = /^\/(u|user)\/([^/.]+)/

export const isSubredditPath = (pathname: string): boolean => {
  return subredditPathRegex.test(pathname)
}

export const isUserPath = (pathname: string): boolean => {
  return userPathRegex.test(pathname)
}

export const redditHandler: PlatformHandler = {
  match: (url) => {
    try {
      const { pathname } = new URL(url)

      return isHostOf(url, hosts) && (isSubredditPath(pathname) || isUserPath(pathname))
    } catch {}

    return false
  },

  resolve: async (url, _content, _headers, fetchFn) => {
    if (!fetchFn) {
      return []
    }

    try {
      const { pathname } = new URL(url)
      const subredditMatch = pathname.match(subredditPathRegex)

      if (subredditMatch?.[1]) {
        const subreddit = subredditMatch[1]
        const apiUrl = `https://www.reddit.com/r/${subreddit}/about.json`
        const response = await fetchFn(apiUrl)
        const data = parseBodyJson(response.body)
        const icon = data?.data?.community_icon?.split('?')[0] || data?.data?.icon_img

        if (isNonEmptyString(icon)) {
          return [{ uri: icon }]
        }
      }

      const userMatch = pathname.match(userPathRegex)

      if (userMatch?.[2]) {
        const username = userMatch[2]
        const apiUrl = `https://www.reddit.com/user/${username}/about.json`
        const response = await fetchFn(apiUrl)
        const data = parseBodyJson(response.body)
        const icon = data?.data?.icon_img || data?.data?.snoovatar_img

        if (isNonEmptyString(icon)) {
          return [{ uri: icon }]
        }
      }
    } catch {}

    return []
  },
}

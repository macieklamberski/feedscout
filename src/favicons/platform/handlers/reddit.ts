import { isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { hosts } from '../../../feeds/platform/handlers/reddit.js'
import type { FaviconEnricher } from '../../types.js'
import { parseBodyJson } from '../../utils.js'

const platform = 'reddit'

// Extracts the subreddit or username from the path, excluding dots to avoid
// capturing feed extensions like .rss in Reddit feed URLs (e.g., /r/sub.rss).
const subredditRegex = /^\/r\/([^/.]+)/
const userRegex = /^\/(u|user)\/([^/.]+)/

export const isSubredditPath = (pathname: string): boolean => {
  return subredditRegex.test(pathname)
}

export const isUserPath = (pathname: string): boolean => {
  return userRegex.test(pathname)
}

export const redditHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    const { pathname } = parsedUrl

    return isHostOf(url, hosts) && (isSubredditPath(pathname) || isUserPath(pathname))
  },

  // The id keeps its `r/` or `user/` prefix: a subreddit and a user share one name grammar and
  // answer with different icon fields.
  resolve: (url) => {
    const pathname = parseUrl(url)?.pathname ?? ''
    const subreddit = pathname.match(subredditRegex)?.[1]

    if (subreddit) {
      return [{ platform, id: `r/${subreddit}`, url }]
    }

    const username = pathname.match(userRegex)?.[2]

    if (username) {
      return [{ platform, id: `user/${username}`, url }]
    }

    return []
  },
}

export const redditEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  try {
    const response = await context.fetchFn(`https://www.reddit.com/${ref.id}/about.json`)
    const data = parseBodyJson(response.body)?.data
    const icon = ref.id.startsWith('r/')
      ? data?.community_icon?.split('?')[0] || data?.icon_img
      : data?.icon_img || data?.snoovatar_img

    if (isNonEmptyString(icon)) {
      return [icon]
    }
  } catch {}

  return []
}

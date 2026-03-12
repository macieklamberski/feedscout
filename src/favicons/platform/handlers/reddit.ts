import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'
import { hosts } from '../../../feeds/platform/handlers/reddit.js'

export const isSubredditPath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length >= 2 && segments[0] === 'r'
}

export const isUserPath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length >= 2 && (segments[0] === 'u' || segments[0] === 'user')
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

      if (isSubredditPath(pathname)) {
        const subreddit = pathname.split('/').filter(Boolean)[1]
        const apiUrl = `https://www.reddit.com/r/${subreddit}/about.json`
        const response = await fetchFn(apiUrl)
        const data = JSON.parse(typeof response.body === 'string' ? response.body : '')
        const icon = data?.data?.community_icon?.split('?')[0] || data?.data?.icon_img

        if (typeof icon === 'string' && icon.length > 0) {
          return [{ uri: icon }]
        }
      }

      if (isUserPath(pathname)) {
        const username = pathname.split('/').filter(Boolean)[1]
        const apiUrl = `https://www.reddit.com/user/${username}/about.json`
        const response = await fetchFn(apiUrl)
        const data = JSON.parse(typeof response.body === 'string' ? response.body : '')
        const icon = data?.data?.icon_img || data?.data?.snoovatar_img

        if (typeof icon === 'string' && icon.length > 0) {
          return [{ uri: icon }]
        }
      }
    } catch {}

    return []
  },
}

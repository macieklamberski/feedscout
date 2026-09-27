import { isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseRedditUrl } from '../../feeds/platforms/reddit.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'reddit'

// The id keeps its `r/` or `user/` prefix: a subreddit and a user share one name grammar and
// answer with different icon fields.
const getProfileId = (url: string): string | undefined => {
  const parsed = parseRedditUrl(url)

  if (parsed && 'subreddit' in parsed) {
    return `r/${parsed.subreddit}`
  }

  if (parsed && 'username' in parsed) {
    return `user/${parsed.username}`
  }
}

export const redditHandler: PlatformHandler = {
  match: (url) => {
    return getProfileId(url) !== undefined
  },

  resolve: (url) => {
    const id = getProfileId(url)

    if (!id) {
      return []
    }

    return [{ platform, id, url }]
  },
}

export const redditEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const response = await context.fetchFn(`https://www.reddit.com/${ref.id}/about.json`)
  const data = parseResponseJson(response)?.data
  const communityIcon = isNonEmptyString(data?.community_icon)
    ? data.community_icon.split('?')[0]
    : undefined
  const icon = ref.id.startsWith('r/')
    ? communityIcon || data?.icon_img
    : data?.icon_img || data?.snoovatar_img

  if (isNonEmptyString(icon)) {
    return [icon]
  }

  return []
}

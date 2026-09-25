import { isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { lemmyHandler as lemmyFeedHandler, parseLemmyUrl } from '../../feeds/platforms/lemmy.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'lemmy'

const getProfileId = (url: string): string | undefined => {
  const parsed = parseLemmyUrl(url)

  if (parsed?.kind === 'community') {
    return `c/${parsed.community}`
  }

  if (parsed?.kind === 'user') {
    return `u/${parsed.username}`
  }
}

export const lemmyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    return !!getProfileId(url) && lemmyFeedHandler.match(url, content, headers)
  },

  resolve: (url, content) => {
    const id = getProfileId(url)

    if (!id) {
      return []
    }

    // The page carries the community icon or user avatar as og:image, and none when it has none.
    const ogImage = content ? getMetaContent(content, 'og:image') : undefined

    if (isNonEmptyString(ogImage)) {
      return [{ uri: ogImage }]
    }

    return [{ platform, id, url }]
  },
}

export const lemmyEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const { origin } = new URL(ref.url)
  const [kind, name] = ref.id.split('/')

  if (kind === 'c') {
    const apiUrl = `${origin}/api/v3/community?name=${encodeURIComponent(name)}`
    const response = await context.fetchFn(apiUrl)
    const icon = parseResponseJson(response)?.community_view?.community?.icon

    if (isNonEmptyString(icon)) {
      return [icon]
    }
  }

  if (kind === 'u') {
    const apiUrl = `${origin}/api/v3/user?username=${encodeURIComponent(name)}&limit=1`
    const response = await context.fetchFn(apiUrl)
    const avatar = parseResponseJson(response)?.person_view?.person?.avatar

    if (isNonEmptyString(avatar)) {
      return [avatar]
    }
  }

  return []
}

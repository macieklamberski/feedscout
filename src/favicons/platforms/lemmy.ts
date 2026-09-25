import { isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import {
  isCommunityPath,
  isLemmyHeaders,
  isLemmyHtml,
  isUserPath,
} from '../../feeds/platforms/lemmy.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'lemmy'

const getProfileId = (pathname: string): string | undefined => {
  const name = pathname.split('/').filter(Boolean)[1]

  if (isCommunityPath(pathname)) {
    return `c/${name}`
  }

  if (isUserPath(pathname)) {
    return `u/${name}`
  }
}

export const lemmyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !getProfileId(parsedUrl.pathname)) {
      return false
    }

    if (content && isLemmyHtml(content)) {
      return true
    }

    if (headers && isLemmyHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url, content) => {
    const id = getProfileId(new URL(url).pathname)

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

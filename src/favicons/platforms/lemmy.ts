import {
  composeQuery,
  getPathSegments,
  getQueryParam,
  includesAnyOf,
  isAnyOf,
  isNonEmptyString,
  parseUrl,
} from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  findElement,
  getMetaContent,
  hasClass,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'lemmy'

type LemmyQuery = { sort?: string; limit?: string }

export type LemmyUrl =
  | ({ kind: 'community'; community: string } & LemmyQuery)
  | ({ kind: 'user'; username: string } & LemmyQuery)
  | ({ kind: 'home' } & LemmyQuery)

export const parseLemmyUrl = (url: string): LemmyUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const [section, name] = getPathSegments(parsedUrl)
  const { searchParams } = parsedUrl
  const sort = getQueryParam(searchParams, 'sort')
  const limit = getQueryParam(searchParams, 'limit')

  if (name && isAnyOf(section, 'c')) {
    return { kind: 'community', community: name, sort, limit }
  }

  if (name && isAnyOf(section, 'u')) {
    return { kind: 'user', username: name, sort, limit }
  }

  return { kind: 'home', sort, limit }
}

// Current Lemmy serves no generator meta.
export const isLemmyHtml = (content: string): boolean => {
  return (
    findElement(content, (element) => hasClass(element, 'lemmy-site')) !== undefined ||
    hasMetaContent(content, 'generator', 'Lemmy')
  )
}

export const isLemmyHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('x-powered-by'), 'lemmy')
}

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
    return (
      !!getProfileId(url) &&
      hasMarker(content, headers, { html: isLemmyHtml, headers: isLemmyHeaders })
    )
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
    const apiUrl = `${origin}/api/v3/community${composeQuery({ name })}`
    const response = await context.fetchFn(apiUrl)
    const icon = parseResponseJson(response)?.community_view?.community?.icon

    if (isNonEmptyString(icon)) {
      return [icon]
    }
  }

  if (kind === 'u') {
    const apiUrl = `${origin}/api/v3/user${composeQuery({ username: name, limit: 1 })}`
    const response = await context.fetchFn(apiUrl)
    const avatar = parseResponseJson(response)?.person_view?.person?.avatar

    if (isNonEmptyString(avatar)) {
      return [avatar]
    }
  }

  return []
}

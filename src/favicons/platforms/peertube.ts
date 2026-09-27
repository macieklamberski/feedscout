import { isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { isPeertubeHeaders, parsePeertubeUrl } from '../../feeds/platforms/peertube.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

type Avatar = {
  width?: number
  path?: string
}

const platform = 'peertube'

const avatarPathPrefix = '/lazy-static/avatars/'

const apiPaths: Record<string, string> = {
  c: 'video-channels',
  a: 'accounts',
}

const getProfileId = (url: string): string | undefined => {
  const parsed = parsePeertubeUrl(url)

  if (!parsed) {
    return
  }

  return `${parsed.kind === 'channel' ? 'c' : 'a'}/${parsed.name}`
}

export const peertubeHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    if (!headers || !isPeertubeHeaders(headers)) {
      return false
    }

    return Boolean(getProfileId(url))
  },

  resolve: (url, content) => {
    const id = getProfileId(url)

    if (!id) {
      return []
    }

    const ogImage = content ? getMetaContent(content, 'og:image') : undefined

    if (ogImage && parseUrl(ogImage)?.pathname.startsWith(avatarPathPrefix)) {
      return [{ uri: ogImage }]
    }

    return [{ platform, id, url }]
  },
}

export const peertubeEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const { origin } = new URL(ref.url)
  const [kind, name] = ref.id.split('/')
  const apiPath = apiPaths[kind]

  if (!apiPath || !name) {
    return []
  }

  const response = await context.fetchFn(`${origin}/api/v1/${apiPath}/${name}`)
  const data = parseResponseJson(response)
  const avatars: Array<Avatar> = Array.isArray(data?.avatars) ? data.avatars : []

  const largest = avatars
    .filter((avatar) => isNonEmptyString(avatar.path))
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]

  if (largest?.path) {
    return [`${origin}${largest.path}`]
  }

  return []
}

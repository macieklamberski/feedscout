import { getOrigin, isNonEmptyString, parseUrl, startsWithAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent, hasMarker } from '../../common/utils.js'
import { isPeertubeHeaders, parsePeertubeUrl } from '../../feeds/platforms/peertube.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

type Avatar = {
  width?: number
  path?: string
}

const platform = 'peertube'

const apiPaths: Record<string, string> = {
  c: 'video-channels',
  a: 'accounts',
}

const getProfileId = (url: string): string | undefined => {
  const parsed = parsePeertubeUrl(url)

  if (!parsed || parsed.kind === 'instance') {
    return
  }

  return `${parsed.kind === 'channel' ? 'c' : 'a'}/${parsed.name}`
}

export const peertubeHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isPeertubeHeaders })) {
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

    if (ogImage && startsWithAnyOf(parseUrl(ogImage)?.pathname, '/lazy-static/avatars/')) {
      return [{ uri: ogImage }]
    }

    return [{ platform, id, url }]
  },
}

export const peertubeEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const origin = getOrigin(ref.url)

  if (!origin) {
    return
  }

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

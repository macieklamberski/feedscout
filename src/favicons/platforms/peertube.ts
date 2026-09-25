import { isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import {
  accountPathRegex,
  channelPathRegex,
  isPeertubeHeaders,
} from '../../feeds/platforms/peertube.js'
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

const getProfileId = (pathname: string): string | undefined => {
  const channel = pathname.match(channelPathRegex)?.[1]

  if (channel) {
    return `c/${channel}`
  }

  const account = pathname.match(accountPathRegex)?.[1]

  if (account) {
    return `a/${account}`
  }
}

export const peertubeHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !headers || !isPeertubeHeaders(headers)) {
      return false
    }

    return Boolean(getProfileId(parsedUrl.pathname))
  },

  resolve: (url, content) => {
    const id = getProfileId(new URL(url).pathname)

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

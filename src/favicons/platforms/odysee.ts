import { isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hosts } from '../../feeds/platforms/odysee.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'odysee'

const apiUrl = 'https://api.na-backend.odysee.com/api/v1/proxy?m=resolve'

const channelRegex = /^\/@([^/:]+(?::[a-f0-9]+)?)(?:\/|$)/i

const imageProtocols = ['http:', 'https:']

const getChannel = (url: string): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(url, hosts)) {
    return
  }

  const match = parsedUrl.pathname.match(channelRegex)

  if (!match?.[1]) {
    return
  }

  try {
    return decodeURIComponent(match[1])
  } catch {}
}

export const odyseeHandler: PlatformHandler = {
  match: (url) => {
    return getChannel(url) !== undefined
  },

  resolve: (url) => {
    const channel = getChannel(url)

    if (!channel) {
      return []
    }

    return [{ platform, id: channel, url }]
  },
}

export const odyseeEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const lbryUrl = `lbry://@${ref.id}`
  const body = JSON.stringify({ method: 'resolve', params: { urls: [lbryUrl] } })
  const response = await context.fetchFn(apiUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
  const data = parseResponseJson(response)
  const thumbnail = data?.result?.[lbryUrl]?.value?.thumbnail?.url
  const thumbnailProtocol = parseUrl(String(thumbnail))?.protocol ?? ''

  // The thumbnail is the channel's raw upload. The upload form crops it to square, but other
  // clients may not, so a few avatars are not square.
  if (isNonEmptyString(thumbnail) && imageProtocols.includes(thumbnailProtocol)) {
    return [thumbnail]
  }

  return []
}

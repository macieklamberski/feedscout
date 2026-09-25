import { isHttpUrl, isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseOdyseeUrl } from '../../feeds/platforms/odysee.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const apiUrl = 'https://api.na-backend.odysee.com/api/v1/proxy?m=resolve'

const platform = 'odysee'

const getChannel = (url: string): string | undefined => {
  const parsed = parseOdyseeUrl(url)

  if (!parsed?.claimId) {
    return parsed?.name
  }

  return `${parsed.name}:${parsed.claimId}`
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

  // The thumbnail is the channel's raw upload. The upload form crops it to square, but other
  // clients may not, so a few avatars are not square.
  if (isNonEmptyString(thumbnail) && isHttpUrl(thumbnail)) {
    return [thumbnail]
  }

  return []
}

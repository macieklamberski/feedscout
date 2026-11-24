import { composeQuery, getPathSegments, isAnyOf, isHostOf, isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'bluesky'

export type BlueskyUrl = { kind: 'profile'; handle: string }

const hosts = ['bsky.app', 'deer.social', 'main.bsky.dev']

export const parseBlueskyUrl = (url: string): BlueskyUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [section, handle] = getPathSegments(url)

  if (!isAnyOf(section, 'profile') || !handle) {
    return
  }

  return { kind: 'profile', handle }
}

export const blueskyHandler: PlatformHandler = {
  match: (url) => {
    return parseBlueskyUrl(url) !== undefined
  },

  resolve: (url) => {
    const handle = parseBlueskyUrl(url)?.handle

    if (!handle) {
      return []
    }

    return [{ platform, id: handle, url }]
  },
}

export const blueskyEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const apiUrl = `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile${composeQuery({ actor: ref.id })}`
  const response = await context.fetchFn(apiUrl)
  const data = parseResponseJson(response)

  if (isNonEmptyString(data.avatar)) {
    return [data.avatar]
  }

  return []
}

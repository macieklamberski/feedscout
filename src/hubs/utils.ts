import { isHttpUrl, parseUrl } from 'trousse'
import { attempt } from '../common/discover/utils.js'
import type { DiscoverOnErrorFn, DiscoverResolveUrlFn } from '../common/types.js'
import type { HubResult } from './discover/types.js'

// A hub is announced for the document's self URL, or for the document itself when it names none.
export const toHubResults = (
  hubUris: Array<string>,
  selfUri: string | undefined,
  baseUrl: string,
  resolveUrlFn: DiscoverResolveUrlFn,
  onError?: DiscoverOnErrorFn,
): Array<HubResult> => {
  const resolve = (uri: string): string => {
    return attempt(() => resolveUrlFn(uri, baseUrl), uri, 'resolveUrlFn', onError)
  }

  // A hub with another scheme, such as a `javascript:` link, cannot be subscribed to. One that does
  // not parse is kept as discovered, as a resolver that answers nothing leaves it.
  const isSubscribable = (hub: string): boolean => {
    return !parseUrl(hub) || isHttpUrl(hub)
  }

  const topic = selfUri ? resolve(selfUri) : baseUrl

  return hubUris
    .map(resolve)
    .filter(isSubscribable)
    .map((hub) => ({ hub, topic }))
}

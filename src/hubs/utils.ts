import { attempt } from '../common/discover/utils.js'
import type { DiscoverOnErrorFn, DiscoverResolveUrlFn } from '../common/types.js'
import type { HubResult } from './discover/types.js'

// A hub is announced for the page's self URL, or for the page itself when it names none.
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

  const topic = selfUri ? resolve(selfUri) : baseUrl

  return hubUris.map((hub) => ({ hub: resolve(hub), topic }))
}

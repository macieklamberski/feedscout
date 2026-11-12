import { getPathSegments, isHostOf, isHostOrSubdomainOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type LagetUrl = { kind: 'team'; team: string }

const hosts = ['laget.se', 'www.laget.se']
const domains = ['laget.se']

// A bare `laget.se` also matches other domains, such as `snickeribolaget.se`.
const lagetAssetRegex = /^(?:https?:)?\/\/[a-z]-content\.laget\.se\//i

const assetTags = ['link', 'script']

const teamFeeds = definePlatformFeeds([
  { key: 'laget:news', template: 'https://www.laget.se/{team}/Home/NewsRss' },
])

// A club on its own domain is known only by its markers, so its feed is built but not claimed.
const clubFeeds = definePlatformFeeds(
  [{ key: 'laget:news', template: '{scheme}://{host}/Home/NewsRss' }],
  { hosts },
)

// Both club templates load their stylesheets and scripts from the asset host, on an own domain too.
export const isLagetHtml = (content: string): boolean => {
  const asset = findElement(content, (element) => {
    const source = element.attribs.href ?? element.attribs.src ?? ''

    return assetTags.includes(element.name) && lagetAssetRegex.test(source)
  })

  return asset !== undefined
}

export const parseLagetUrl = (url: string): LagetUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [team] = getPathSegments(url)

  if (!team || team.includes('.')) {
    return
  }

  return { kind: 'team', team }
}

export const lagetHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (isHostOrSubdomainOf(url, domains)) {
      return parseLagetUrl(url) !== undefined
    }

    return hasMarker(content, headers, { html: isLagetHtml })
  },

  resolve: (url) => {
    const parsed = parseLagetUrl(url)

    if (parsed) {
      // The team page links its feed with the team spelled as the request spelled it.
      return [teamFeeds.getFeedEntry('laget:news', { team: parsed.team })]
    }

    if (isHostOrSubdomainOf(url, domains)) {
      return []
    }

    const { protocol, host } = new URL(url)

    return [clubFeeds.getFeedEntry('laget:news', { scheme: protocol.slice(0, -1), host })]
  },

  getFeedKey: teamFeeds.getFeedKey,
}

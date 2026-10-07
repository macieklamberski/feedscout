import { getPathSegments, isAnyOf, isHostOf, isHostOrSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type LagetUrl = { kind: 'team'; team: string }

const hosts = ['laget.se', 'www.laget.se']
const domains = ['laget.se']

// A bare `laget.se` also matches other domains, such as `snickeribolaget.se`.
const lagetAssetRegex = /^(?:https?:)?\/\/g-content\.laget\.se\//

const assetTags = ['link', 'script']
// Site-wide routes on the team host, beside site files such as `Price.html`.
const excludedPaths = ['common', 'content', 'cupguide', 'cupguiden', 'handlers', 'login']

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

  if (!team || team.includes('.') || isAnyOf(team, excludedPaths)) {
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
      return [
        {
          uri: `https://www.laget.se/${parsed.team}/Home/NewsRss`,
          hint: composeHint('laget:news'),
        },
      ]
    }

    if (isHostOrSubdomainOf(url, domains)) {
      return []
    }

    // A club on its own domain serves its news feed at the domain root.
    const { origin } = new URL(url)

    return [{ uri: `${origin}/Home/NewsRss`, hint: composeHint('laget:news') }]
  },
}

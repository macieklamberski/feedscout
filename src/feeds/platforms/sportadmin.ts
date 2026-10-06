import { getSubdomain, isAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers club (guess), partly covers team.

export type SportadminPage = { kind: 'club' } | { kind: 'team'; sectionId: string }

const domains = ['web.sportadmin.se']

// The link to the other layout, "Gå till Webbversion" or its app counterpart.
const layoutLinkRegex = /^\.\.\/\?SID=(\d+)&platform=(?:app|web)$/i
// The next game widget, which the classic template prints on the club home page alone.
const nextGameRegex = /wNextGame\.asp\?SID=(\d+)/i
const sectionIdRegex = /^\d+$/

// Every label resolves to the club farm, and www redirects to the marketing site.
const excludedSubdomains = ['www']

const findLayoutSectionId = (content: string | undefined): string | undefined => {
  const link = findElement(content, (element) => {
    return element.name === 'a' && layoutLinkRegex.test(element.attribs.href ?? '')
  })

  return link?.attribs.href?.match(layoutLinkRegex)?.[1]
}

// The new template answers an unknown section with the club home page, whose canonical is the
// root, and its feed then serves the club news items.
const getUrlSectionId = (url: string, content: string | undefined): string | undefined => {
  const sectionId = new URL(url).searchParams.get('SID')
  const canonical = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'canonical'
  })?.attribs.href

  if (!sectionId || !sectionIdRegex.test(sectionId) || !canonical) {
    return
  }

  if (parseUrl(canonical, url)?.pathname === '/') {
    return
  }

  return sectionId
}

export const getSportadminPage = (
  url: string,
  content: string | undefined,
): SportadminPage | undefined => {
  const club = getSubdomain(url, domains)

  // The certificate covers one label, so a dotted subdomain such as www.{club} names no club.
  if (!club || club.includes('.') || isAnyOf(club, excludedSubdomains)) {
    return
  }

  // On the classic template a team url redirects to `/start/?ID={page}`, so the layout link names
  // the team. The new template prints no layout link and keeps `/?SID={id}` in the url.
  const sectionId = findLayoutSectionId(content) ?? getUrlSectionId(url, content)

  // On the club home page the layout link names the root section, whose feed serves the club
  // news items.
  if (!sectionId || sectionId === content?.match(nextGameRegex)?.[1]) {
    return { kind: 'club' }
  }

  return { kind: 'team', sectionId }
}

export const sportadminHandler: PlatformHandler = {
  match: (url, content) => {
    return getSportadminPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getSportadminPage(url, content)

    if (!page) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'team') {
      uris.push({
        uri: `${origin}/rss/?SID=${page.sectionId}`,
        hint: composeHint('sportadmin:team'),
      })
    }

    uris.push({ uri: `${origin}/rss/`, hint: composeHint('sportadmin:news') })

    return uris
  },
}

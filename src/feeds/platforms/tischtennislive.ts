import { getSubdomain, isAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers group, league (html), partly covers association.

export type TischtennisliveUrl = { kind: 'association' }

export type TischtennislivePage =
  | { kind: 'association' }
  | { kind: 'group'; group: string }
  | { kind: 'league'; league: string }

const domains = ['tischtennislive.de']

const resultsFeedPathRegex = /^\/Export\/Tischtennis\/RSS\.aspx$/i
const resultsIdRegex = /^\d+$/

// The product page of the software, which every unknown subdomain also serves.
const excludedSubdomains = ['www']

export const parseTischtennisliveUrl = (url: string): TischtennisliveUrl | undefined => {
  const association = getSubdomain(url, domains)

  if (!association || association.includes('.') || isAnyOf(association, excludedSubdomains)) {
    return
  }

  return { kind: 'association' }
}

// A results feed answers 200 to any id, and a made-up group id with another group's matches, so
// the id is read from the feed link the page prints and never from the page url.
export const getTischtennislivePage = (
  url: string,
  content: string | undefined,
): TischtennislivePage | undefined => {
  const parsed = parseTischtennisliveUrl(url)

  if (!parsed) {
    return
  }

  const { hostname } = new URL(url)
  const link = findElement(content, (element) => {
    if (element.name !== 'a') {
      return false
    }

    const linkUrl = parseUrl(element.attribs.href ?? '', url)

    return linkUrl?.hostname === hostname && resultsFeedPathRegex.test(linkUrl.pathname)
  })
  const feedUrl = parseUrl(link?.attribs.href ?? '', url)
  const id = feedUrl?.searchParams.get('ID') ?? ''

  if (!resultsIdRegex.test(id)) {
    return parsed
  }

  const type = feedUrl?.searchParams.get('Typ')

  if (type === 'Gruppe') {
    return { kind: 'group', group: id }
  }

  if (type === 'Wett') {
    return { kind: 'league', league: id }
  }

  return parsed
}

export const tischtennisliveHandler: PlatformHandler = {
  match: (url) => {
    return parseTischtennisliveUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getTischtennislivePage(url, content)

    if (!page) {
      return []
    }

    const { origin } = new URL(url)
    const resultsUrl = `${origin}/Export/Tischtennis/RSS.aspx`
    const uris: Array<DiscoverUriEntry> = []

    // Next=0 lists the matches of the last 10 days and Next=1 those of the next 10 days.
    if (page.kind === 'group') {
      uris.push({
        uri: `${resultsUrl}?Typ=Gruppe&ID=${page.group}&Next=0`,
        hint: composeHint('tischtennislive:group-results'),
      })
      uris.push({
        uri: `${resultsUrl}?Typ=Gruppe&ID=${page.group}&Next=1`,
        hint: composeHint('tischtennislive:group-fixtures'),
      })

      return uris
    }

    if (page.kind === 'league') {
      uris.push({
        uri: `${resultsUrl}?Typ=Wett&ID=${page.league}&Next=0`,
        hint: composeHint('tischtennislive:league-results'),
      })
      uris.push({
        uri: `${resultsUrl}?Typ=Wett&ID=${page.league}&Next=1`,
        hint: composeHint('tischtennislive:league-fixtures'),
      })

      return uris
    }

    uris.push({ uri: `${origin}/Export/RSS.aspx`, hint: composeHint('tischtennislive:news') })
    uris.push({
      uri: `${origin}/Export/RSS_Termine.aspx`,
      hint: composeHint('tischtennislive:dates'),
    })
    uris.push({
      uri: `${origin}/Export/RSS_Dokumente.aspx`,
      hint: composeHint('tischtennislive:documents'),
    })
    uris.push({
      uri: `${origin}/Export/Tischtennis/RSS_Turniere.aspx`,
      hint: composeHint('tischtennislive:tournaments'),
    })

    return uris
  },
}

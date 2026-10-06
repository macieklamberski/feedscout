import { getSubdomain, isAnyOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PurotUrl = { kind: 'wiki'; wiki: string }

export type PurotPage =
  | { kind: 'wiki'; wiki: string }
  | { kind: 'page'; wiki: string; page: string }

const domains = ['purot.net']

// A profile id holds a slash, so a profile page never matches. A profile page links its user's
// feeds even when it answers "User not found", and a real profile redirects to the home page.
const pageChangesRegex = /^\/changes\/([^/?]+)\?mode=rss&messages=0$/

// The service's sign-in host and the redirect to its home page, not wikis.
const excludedSubdomains = ['my', 'www']

export const parsePurotUrl = (url: string): PurotUrl | undefined => {
  const wiki = getSubdomain(url, domains)

  if (!wiki || wiki.includes('.') || isAnyOf(wiki, excludedSubdomains)) {
    return
  }

  return { kind: 'wiki', wiki }
}

// A made-up page id answers the whole wiki's changes, so the page comes from its own feed link,
// which also spells the id the way the wiki does for a url in another case.
export const getPurotPage = (url: string, content: string | undefined): PurotPage | undefined => {
  const parsed = parsePurotUrl(url)

  if (!parsed) {
    return
  }

  const link = findElement(content, (element) => {
    return element.name === 'link' && pageChangesRegex.test(element.attribs.href ?? '')
  })
  const page = link?.attribs.href?.match(pageChangesRegex)?.[1]

  if (!page) {
    return parsed
  }

  return { kind: 'page', wiki: parsed.wiki, page }
}

export const purotHandler: PlatformHandler = {
  match: (url) => {
    return parsePurotUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getPurotPage(url, content)

    if (!page) {
      return []
    }

    const origin = `https://${page.wiki}.purot.net`
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'page') {
      uris.push({
        uri: `${origin}/changes/${page.page}?mode=rss&messages=0`,
        hint: composeHint('purot:page-changes'),
      })
      uris.push({
        uri: `${origin}/changes/${page.page}?mode=rss&pages=0`,
        hint: composeHint('purot:page-discussions'),
      })
      uris.push({
        uri: `${origin}/changes/${page.page}?mode=rss`,
        hint: composeHint('purot:page-activity'),
      })
    }

    uris.push({ uri: `${origin}/changes/all?mode=rss`, hint: composeHint('purot:recent-changes') })

    return uris
  },
}

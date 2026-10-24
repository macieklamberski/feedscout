import { escapeRegex, getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers profile, related (guess, html), partly covers huffduff.

export type HuffdufferUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'huffduff'; username: string; id: string }
  | { kind: 'related'; username: string; id: string }
  | { kind: 'home' }

const hosts = ['huffduffer.com', 'www.huffduffer.com']
const origin = 'https://huffduffer.com'

export const parseHuffdufferUrl = (url: string): HuffdufferUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, section, subsection] = getPathSegments(url)

  if (!username) {
    return { kind: 'home' }
  }

  if (section && digitsRegex.test(section) && isAnyOf(subsection, 'related')) {
    return { kind: 'related', username, id: section }
  }

  if (section && digitsRegex.test(section)) {
    return { kind: 'huffduff', username, id: section }
  }

  return { kind: 'profile', username }
}

export const huffdufferHandler: PlatformHandler = {
  match: (url) => {
    return parseHuffdufferUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseHuffdufferUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'home') {
      return [
        { uri: `${origin}/new/rss`, hint: composeHint('huffduffer:new', 'rss') },
        { uri: `${origin}/new/atom`, hint: composeHint('huffduffer:new', 'atom') },
        { uri: `${origin}/new/json`, hint: composeHint('huffduffer:new', 'json') },
      ]
    }

    // Usernames match in any case, and the page links its feeds with the account's own spelling:
    // `/bluetyson` links `/BlueTyson/rss`.
    const usernameRegex = new RegExp(`huffduffer\\.com/(${escapeRegex(parsed.username)})/`, 'i')
    const username = content?.match(usernameRegex)?.[1] ?? parsed.username
    const huffduffsFeed: DiscoverUriEntry = {
      uri: `${origin}/${username}/rss`,
      hint: composeHint('huffduffer:huffduffs'),
    }

    if (parsed.kind === 'profile') {
      return [huffduffsFeed]
    }

    const relatedFeed: DiscoverUriEntry = {
      uri: `${origin}/${username}/${parsed.id}/related/rss`,
      hint: composeHint('huffduffer:related'),
    }

    if (parsed.kind === 'related') {
      return [relatedFeed]
    }

    return [relatedFeed, huffduffsFeed]
  },
}

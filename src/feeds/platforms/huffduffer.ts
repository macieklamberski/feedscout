import { escapeRegex, getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HuffdufferUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'huffduff'; username: string; id: string }
  | { kind: 'related'; username: string; id: string }

const hosts = ['huffduffer.com', 'www.huffduffer.com']
const origin = 'https://huffduffer.com'

const idRegex = /^\d+$/

// Site pages, not users. `new`, `popular` and `search` serve site-wide feeds at `/{path}/rss`.
const excludedPaths = [
  'about',
  'add',
  'api',
  'login',
  'logout',
  'new',
  'people',
  'popular',
  'search',
  'signup',
  'tags',
  'users',
]

export const parseHuffdufferUrl = (url: string): HuffdufferUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, section, subsection] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  if (section && idRegex.test(section) && isAnyOf(subsection, 'related')) {
    return { kind: 'related', username, id: section }
  }

  if (section && idRegex.test(section)) {
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

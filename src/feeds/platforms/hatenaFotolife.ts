import { decodeSegment, getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HatenaFotolifeUrl =
  | { kind: 'user'; username: string }
  | { kind: 'model'; username: string; model: string }
  | { kind: 'folder'; username: string; folder: string }
  | { kind: 'tag'; username: string; tag: string }
  | { kind: 'favorite'; username: string }
  | { kind: 'starfriends'; username: string }

const hosts = ['f.hatena.ne.jp']

// A Hatena ID: 3 to 32 characters, starting with a letter. Old IDs such as `kumapu-` end in a hyphen.
const usernameRegex = /^[a-zA-Z][\w-]{2,31}$/

// Site-wide listings, not users.
const excludedPaths = ['focallength', 'fotocolor', 'help', 'hotfoto', 'model', 'userlist']

// The page links its feeds with every byte outside [A-Za-z0-9_] percent-encoded, `-` and `.`
// included, so the same spelling dedupes against the page's own link.
const escapeSegment = (value: string): string => {
  return encodeURIComponent(value).replace(/[-.!~*'()]/g, (char) => {
    return `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  })
}

export const parseHatenaFotolifeUrl = (url: string): HatenaFotolifeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [username, section, value] = getPathSegments(parsedUrl)

  if (!username || !usernameRegex.test(username) || isAnyOf(username, excludedPaths)) {
    return
  }

  const tag = decodeSegment(value)

  if (isAnyOf(section, 't') && tag) {
    return { kind: 'tag', username, tag }
  }

  if (isAnyOf(section, 't')) {
    return { kind: 'user', username }
  }

  if (isAnyOf(section, 'favorite')) {
    return { kind: 'favorite', username }
  }

  if (isAnyOf(section, 'starfriends')) {
    return { kind: 'starfriends', username }
  }

  // A folder page ends in a slash, and `/{user}/{folder}` without it answers 404.
  const folder = decodeSegment(section)
  const isFolderPath = parsedUrl.pathname.endsWith('/') || isAnyOf(value, 'rss')

  if (folder && isFolderPath && !isAnyOf(folder, 'rss')) {
    return { kind: 'folder', username, folder }
  }

  const model = parsedUrl.searchParams.get('model')

  if (model) {
    return { kind: 'model', username, model }
  }

  // Photo pages and the user feed fall back to the user.
  return { kind: 'user', username }
}

export const hatenaFotolifeHandler: PlatformHandler = {
  match: (url) => {
    return parseHatenaFotolifeUrl(url) !== undefined
  },

  resolve: (url, content) => {
    let parsed = parseHatenaFotolifeUrl(url)

    if (!parsed) {
      return []
    }

    // A tag or camera model exists only through its photos, and Hatena serves an empty feed under
    // any made-up folder, tag or model name. Its page then lists no photo, and the page still
    // belongs to the user.
    const isListing = parsed.kind === 'folder' || parsed.kind === 'tag' || parsed.kind === 'model'

    if (isListing && content !== undefined && !content.includes('class="foto_thumb"')) {
      parsed = { kind: 'user', username: parsed.username }
    }

    const { origin } = new URL(url)
    const userUrl = `${origin}/${escapeSegment(parsed.username)}`

    if (parsed.kind === 'model') {
      const model = escapeSegment(parsed.model)

      return [{ uri: `${userUrl}/rss?model=${model}`, hint: composeHint('hatena-fotolife:model') }]
    }

    if (parsed.kind === 'folder') {
      const folder = escapeSegment(parsed.folder)

      return [{ uri: `${userUrl}/${folder}/rss`, hint: composeHint('hatena-fotolife:folder') }]
    }

    if (parsed.kind === 'tag') {
      const tag = escapeSegment(parsed.tag)

      return [{ uri: `${userUrl}/t/${tag}?mode=rss`, hint: composeHint('hatena-fotolife:tag') }]
    }

    if (parsed.kind === 'favorite') {
      return [
        {
          uri: `${origin}/${parsed.username}/favorite?mode=rss`,
          hint: composeHint('hatena-fotolife:stars'),
        },
      ]
    }

    if (parsed.kind === 'starfriends') {
      return [
        {
          uri: `${origin}/${parsed.username}/starfriends?mode=rss`,
          hint: composeHint('hatena-fotolife:star-friends'),
        },
      ]
    }

    return [{ uri: `${userUrl}/rss`, hint: composeHint('hatena-fotolife:photos') }]
  },
}

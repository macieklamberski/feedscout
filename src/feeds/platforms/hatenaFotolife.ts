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
export type HatenaFotolifePage = HatenaFotolifeUrl

const hosts = ['f.hatena.ne.jp']

// A Hatena ID starts with a letter. Old IDs such as `kumapu-` end in a hyphen.
const usernameRegex = /^[a-zA-Z][\w-]*$/

// A photo id is the 14-digit time it was uploaded.
const photoIdRegex = /^\d{14}$/

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

  if (!username || !usernameRegex.test(username)) {
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

  if (folder && isFolderPath && !isAnyOf(folder, 'rss') && !photoIdRegex.test(folder)) {
    return { kind: 'folder', username, folder }
  }

  const model = parsedUrl.searchParams.get('model')

  if (model) {
    return { kind: 'model', username, model }
  }

  // Photo pages and the user feed fall back to the user.
  return { kind: 'user', username }
}

export const getHatenaFotolifePage = (
  url: string,
  content: string | undefined,
): HatenaFotolifePage | undefined => {
  const parsed = parseHatenaFotolifeUrl(url)

  if (!parsed) {
    return
  }

  // A tag or camera model exists only through its photos, and Hatena serves an empty feed under
  // any made-up folder, tag or model name. Its page then lists no photo, and the page still
  // belongs to the user.
  const isListing = parsed.kind === 'folder' || parsed.kind === 'tag' || parsed.kind === 'model'

  if (isListing && content !== undefined && !content.includes('class="foto_thumb"')) {
    return { kind: 'user', username: parsed.username }
  }

  return parsed
}

export const hatenaFotolifeHandler: PlatformHandler = {
  match: (url) => {
    return parseHatenaFotolifeUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getHatenaFotolifePage(url, content)

    if (!page) {
      return []
    }

    const { origin } = new URL(url)
    const userUrl = `${origin}/${escapeSegment(page.username)}`

    if (page.kind === 'model') {
      const model = escapeSegment(page.model)

      return [{ uri: `${userUrl}/rss?model=${model}`, hint: composeHint('hatena-fotolife:model') }]
    }

    if (page.kind === 'folder') {
      const folder = escapeSegment(page.folder)

      return [{ uri: `${userUrl}/${folder}/rss`, hint: composeHint('hatena-fotolife:folder') }]
    }

    if (page.kind === 'tag') {
      const tag = escapeSegment(page.tag)

      return [{ uri: `${userUrl}/t/${tag}?mode=rss`, hint: composeHint('hatena-fotolife:tag') }]
    }

    if (page.kind === 'favorite') {
      return [
        {
          uri: `${origin}/${page.username}/favorite?mode=rss`,
          hint: composeHint('hatena-fotolife:stars'),
        },
      ]
    }

    if (page.kind === 'starfriends') {
      return [
        {
          uri: `${origin}/${page.username}/starfriends?mode=rss`,
          hint: composeHint('hatena-fotolife:star-friends'),
        },
      ]
    }

    return [{ uri: `${userUrl}/rss`, hint: composeHint('hatena-fotolife:photos') }]
  },
}

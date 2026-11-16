import { decodeSegment, getPathSegments, getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { letterThenWordOrHyphenRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HatenaFotolifeUrl =
  | { kind: 'user'; username: string }
  | { kind: 'model'; username: string; model: string }
  | { kind: 'folder'; username: string; folder: string }
  | { kind: 'tag'; username: string; tag: string }
  | { kind: 'favorite'; username: string }
  | { kind: 'starfriends'; username: string }
  | { kind: 'userlist' }
  | { kind: 'siteModel'; model: string }
  | { kind: 'focalLength'; focalLength: string }
  | { kind: 'color'; color: string }

const hosts = ['f.hatena.ne.jp']

// A photo id is the 14-digit time it was uploaded.
// length: keeps a photo id out of the folder slot
const photoIdRegex = /^\d{14}$/

// The marks encodeURIComponent leaves as they are.
const unreservedMarkRegex = /[-.!~*'()]/g

const feeds = definePlatformFeeds(
  [
    { key: 'hatena-fotolife:photos', main: 'https://f.hatena.ne.jp/{username}/rss' },
    { key: 'hatena-fotolife:model', main: 'https://f.hatena.ne.jp/{username}/rss?model={model}' },
    { key: 'hatena-fotolife:folder', main: 'https://f.hatena.ne.jp/{username}/{folder}/rss' },
    { key: 'hatena-fotolife:tag', main: 'https://f.hatena.ne.jp/{username}/t/{tag}?mode=rss' },
    { key: 'hatena-fotolife:stars', main: 'https://f.hatena.ne.jp/{username}/favorite?mode=rss' },
    {
      key: 'hatena-fotolife:star-friends',
      main: 'https://f.hatena.ne.jp/{username}/starfriends?mode=rss',
    },
    // Site-wide listings: the newest photos, and photos by camera model, focal length or color.
    { key: 'hatena-fotolife:recent', main: 'https://f.hatena.ne.jp/userlist?mode=rss' },
    { key: 'hatena-fotolife:site-model', main: 'https://f.hatena.ne.jp/model/{model}?mode=rss' },
    {
      key: 'hatena-fotolife:focal-length',
      main: 'https://f.hatena.ne.jp/focallength/{focalLength}?mode=rss',
    },
    { key: 'hatena-fotolife:color', main: 'https://f.hatena.ne.jp/fotocolor/{color}?mode=rss' },
  ],
  { hosts },
)

// The page links its feeds with every byte outside [A-Za-z0-9_] percent-encoded, `-` and `.`
// included, so the same spelling dedupes against the page's own link.
const escapeSegment = (value: string): string => {
  return encodeURIComponent(value).replace(unreservedMarkRegex, (char) => {
    return `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  })
}

export const parseHatenaFotolifeUrl = (url: string): HatenaFotolifeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [username, section, value] = getPathSegments(parsedUrl)

  // The site-wide listings sit on fixed routes, which also read as a Hatena ID.
  if (isAnyOf(username, 'userlist')) {
    return { kind: 'userlist' }
  }

  if (isAnyOf(username, 'model') && section) {
    return { kind: 'siteModel', model: section }
  }

  if (isAnyOf(username, 'focallength') && section) {
    return { kind: 'focalLength', focalLength: section }
  }

  if (isAnyOf(username, 'fotocolor') && section) {
    return { kind: 'color', color: section }
  }

  // A Hatena ID starts with a letter. Old IDs such as `kumapu-` end in a hyphen.
  if (!username || !letterThenWordOrHyphenRegex.test(username)) {
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

  const model = getQueryParam(parsedUrl.searchParams, 'model')

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

  resolve: (url) => {
    const parsed = parseHatenaFotolifeUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'userlist') {
      return [feeds.getFeedEntry('hatena-fotolife:recent')]
    }

    // A listing page links its feed with the value as the page URL spells it.
    if (parsed.kind === 'siteModel') {
      return [
        feeds.getFeedEntry('hatena-fotolife:site-model', { model: parsed.model }),
        feeds.getFeedEntry('hatena-fotolife:recent'),
      ]
    }

    if (parsed.kind === 'focalLength') {
      return [
        feeds.getFeedEntry('hatena-fotolife:focal-length', { focalLength: parsed.focalLength }),
        feeds.getFeedEntry('hatena-fotolife:recent'),
      ]
    }

    if (parsed.kind === 'color') {
      return [
        feeds.getFeedEntry('hatena-fotolife:color', { color: parsed.color }),
        feeds.getFeedEntry('hatena-fotolife:recent'),
      ]
    }

    const username = escapeSegment(parsed.username)

    if (parsed.kind === 'model') {
      return [
        feeds.getFeedEntry('hatena-fotolife:model', { username, model: parsed.model }),
        feeds.getFeedEntry('hatena-fotolife:recent'),
      ]
    }

    if (parsed.kind === 'folder') {
      const folder = escapeSegment(parsed.folder)

      return [
        feeds.getFeedEntry('hatena-fotolife:folder', { username, folder }),
        feeds.getFeedEntry('hatena-fotolife:recent'),
      ]
    }

    if (parsed.kind === 'tag') {
      const tag = escapeSegment(parsed.tag)

      return [
        feeds.getFeedEntry('hatena-fotolife:tag', { username, tag }),
        feeds.getFeedEntry('hatena-fotolife:recent'),
      ]
    }

    if (parsed.kind === 'favorite') {
      return [
        feeds.getFeedEntry('hatena-fotolife:stars', { username: parsed.username }),
        feeds.getFeedEntry('hatena-fotolife:recent'),
      ]
    }

    if (parsed.kind === 'starfriends') {
      return [
        feeds.getFeedEntry('hatena-fotolife:star-friends', { username: parsed.username }),
        feeds.getFeedEntry('hatena-fotolife:recent'),
      ]
    }

    return [
      feeds.getFeedEntry('hatena-fotolife:photos', { username }),
      feeds.getFeedEntry('hatena-fotolife:recent'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}

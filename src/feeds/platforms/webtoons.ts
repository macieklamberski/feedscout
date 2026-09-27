import { getAnyOf, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers canvas, series (html).
// Handler needed for: episode.

export type WebtoonsUrl = {
  kind: 'series'
  language: string
  genre: string
  name: string
  titleNo: string
}

const hosts = ['webtoons.com', 'www.webtoons.com', 'm.webtoons.com']

const seriesRegex = /^\/([^/]+)\/([^/]+)\/([^/]+)\/(?:list|[^/]+\/viewer)\/?$/i
const titleNoRegex = /^\d+$/

const languages = ['de', 'en', 'es', 'fr', 'id', 'th', 'zh-hant']
const canvasGenres = ['canvas', 'challenge']

export const parseWebtoonsUrl = (url: string): WebtoonsUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [, languageSegment, genre, name] = parsedUrl.pathname.match(seriesRegex) ?? []
  const language = getAnyOf(languageSegment, languages)
  const titleNo = parsedUrl.searchParams.get('title_no')

  if (!language || !genre || !name || !titleNo || !titleNoRegex.test(titleNo)) {
    return
  }

  return { kind: 'series', language, genre, name, titleNo }
}

export const webtoonsHandler: PlatformHandler = {
  match: (url) => {
    return parseWebtoonsUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseWebtoonsUrl(url)

    if (!parsed) {
      return []
    }

    // Canvas series serve their feed under /challenge/, and an original's feed answers
    // 500 unless its genre and name match the series.
    const genre = isAnyOf(parsed.genre, canvasGenres) ? 'challenge' : parsed.genre

    return [
      {
        uri: `https://www.webtoons.com/${parsed.language}/${genre}/${parsed.name}/rss?title_no=${parsed.titleNo}`,
        hint: composeHint('webtoons:series'),
      },
    ]
  },
}

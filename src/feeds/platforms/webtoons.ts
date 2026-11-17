import { getQueryParam, isAnyOf, isHostOf, isLocale, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: series.

export type WebtoonsUrl = {
  kind: 'series'
  language: string
  genre: string
  name: string
  titleNo: string
}

const hosts = ['webtoons.com', 'www.webtoons.com', 'm.webtoons.com']

const seriesRegex = /^\/([^/]+)\/([^/]+)\/([^/]+)\/(?:list|[^/]+\/viewer)\/?$/i

const canvasGenres = ['canvas', 'challenge']

const feeds = definePlatformFeeds(
  [
    {
      key: 'webtoons:series',
      main: 'https://www.webtoons.com/{language}/{genre}/{name}/rss?title_no={titleNo}',
      aliases: [
        'https://sg.webtoons.com/{language}/{genre}/{name}/rss?title_no={titleNo}',
        'https://us.webtoons.com/{language}/{genre}/{name}/rss?title_no={titleNo}',
      ],
    },
  ],
  { checks: { language: isLocale } },
)

export const parseWebtoonsUrl = (url: string): WebtoonsUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [, language, genre, name] = parsedUrl.pathname.match(seriesRegex) ?? []
  const titleNo = getQueryParam(parsedUrl.searchParams, 'title_no')

  if (
    !language ||
    !isLocale(language) ||
    !genre ||
    !name ||
    !titleNo ||
    !digitsRegex.test(titleNo)
  ) {
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

    return [feeds.getFeedEntry('webtoons:series', { ...parsed, genre })]
  },

  getFeedHint: feeds.getFeedHint,
}

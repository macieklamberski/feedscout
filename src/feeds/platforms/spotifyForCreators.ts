import { spotifyForCreators } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SpotifyForCreatorsUrl = { kind: 'show' }
export type SpotifyForCreatorsPage = { kind: 'show'; stationId: string }

const feeds = withHintLabels(spotifyForCreators.feeds)

// A show without RSS answers 404 on `/s/`. Only 2 of the 4 shows measured also show a visible `/s/`
// link, which generic discovery reads, so the alternate link names the station for the others.
const getLinkedStationId = (href: string | undefined): string | undefined => {
  const page = spotifyForCreators.pages.readUrl(href ?? '')

  if (page?.key !== 'station') {
    return
  }

  return page.values.stationId
}

export const parseSpotifyForCreatorsUrl = (url: string): SpotifyForCreatorsUrl | undefined => {
  if (spotifyForCreators.pages.readUrl(url)?.key !== 'show') {
    return
  }

  return { kind: 'show' }
}

export const getSpotifyForCreatorsPage = (
  url: string,
  content: string | undefined,
): SpotifyForCreatorsPage | undefined => {
  const parsed = parseSpotifyForCreatorsUrl(url)
  const link = findElement(content, (element) => {
    return getLinkedStationId(element.attribs.href) !== undefined
  })
  const stationId = getLinkedStationId(link?.attribs.href)

  if (!parsed || !stationId) {
    return
  }

  return { kind: 'show', stationId }
}

export const spotifyForCreatorsHandler: PlatformHandler = {
  match: (url) => {
    return parseSpotifyForCreatorsUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getSpotifyForCreatorsPage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { stationId: page.stationId })]
  },

  getFeedHint: feeds.getFeedHint,
}

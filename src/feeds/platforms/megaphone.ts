import { megaphone } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: podcast.

export type MegaphoneUrl = { kind: 'playlist'; showId: string } | { kind: 'episode' }
export type MegaphonePage = { kind: 'playlist' | 'episode'; showId: string }

const feeds = withHintLabels(megaphone.feeds)

export const parseMegaphoneUrl = (url: string): MegaphoneUrl | undefined => {
  const page = megaphone.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'playlist') {
    return { kind: 'playlist', showId: page.params.showId }
  }

  return { kind: 'episode' }
}

const getLinkedShowId = (href: string | undefined): string | undefined => {
  return megaphone.feeds.read(href ?? '')?.params.showId
}

export const getMegaphonePage = (
  url: string,
  content: string | undefined,
): MegaphonePage | undefined => {
  const parsed = parseMegaphoneUrl(url)

  if (!parsed) {
    return
  }

  if (parsed.kind === 'playlist') {
    return parsed
  }

  // An episode id is not its show's id, so the show comes from the player's RSS link.
  const link = findElement(content, (element) => {
    return getLinkedShowId(element.attribs.href) !== undefined
  })
  const showId = getLinkedShowId(link?.attribs.href)

  if (!showId) {
    return
  }

  return { kind: 'episode', showId }
}

export const megaphoneHandler: PlatformHandler = {
  match: (url) => {
    return parseMegaphoneUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getMegaphonePage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { showId: page.showId })]
  },

  getFeedHint: feeds.getFeedHint,
}

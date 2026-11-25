import { librivox } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: audiobook.
// Handler needed for: latest.

const feeds = withHintLabels(librivox.feeds)

export type LibrivoxPage = { audiobookId: string }

// An audiobook page links its feed by numeric id, which the slug does not carry.
const getAudiobookId = (href: string | undefined): string | undefined => {
  const feed = librivox.feeds.readUrl(href ?? '')

  if (feed?.key !== 'audiobook') {
    return
  }

  return feed.values.audiobookId
}

const getLibrivoxPage = (url: string, content: string | undefined): LibrivoxPage | undefined => {
  if (librivox.pages.readUrl(url)?.key !== 'audiobook') {
    return
  }

  const link = findElement(content, (element) => getAudiobookId(element.attribs.href) !== undefined)
  const audiobookId = getAudiobookId(link?.attribs.href)

  if (!audiobookId) {
    return
  }

  return { audiobookId }
}

export const librivoxHandler: PlatformHandler = {
  match: (url) => {
    return librivox.pages.readUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getLibrivoxPage(url, content)

    if (!page) {
      return [feeds.getFeedEntry('latest')]
    }

    return [
      feeds.getFeedEntry('audiobook', { audiobookId: page.audiobookId }),
      feeds.getFeedEntry('latest'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}

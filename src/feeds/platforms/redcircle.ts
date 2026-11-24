import { redcircle } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type RedcirclePage = { showUuid: string }

const feeds = withHintLabels(redcircle.feeds)

const findShowUuid = (url: string, content: string | undefined): string | undefined => {
  const page = redcircle.pages.read(url)

  if (page?.key === 'show') {
    return page.params.showUuid
  }

  if (!page || !content) {
    return
  }

  // A show or episode page under a slug names the show uuid in its `og:url`.
  const ogPage = redcircle.pages.read(getMetaContent(content, 'og:url') ?? '')

  if (ogPage?.key !== 'show') {
    return
  }

  return ogPage.params.showUuid
}

const getRedcirclePage = (url: string, content: string | undefined): RedcirclePage | undefined => {
  const showUuid = findShowUuid(url, content)

  if (!showUuid) {
    return
  }

  return { showUuid }
}

export const redcircleHandler: PlatformHandler = {
  match: (url, content) => {
    return getRedcirclePage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getRedcirclePage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('show', { showUuid: page.showUuid })]
  },

  getFeedHint: feeds.getFeedHint,
}

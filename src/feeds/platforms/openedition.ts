import { openedition } from 'feedintel'
import { getPathSegments, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: documents, issues.
// Handler needed for: reviews.

export type OpeneditionUrl = { kind: 'journal'; journal: string }

const hosts = openedition.hosts.exact

const feeds = withHintLabels(openedition.feeds)

export const parseOpeneditionUrl = (url: string): OpeneditionUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [journal] = getPathSegments(url)

  // A dotted segment such as feed.php is a file of the site.
  if (!journal || journal.includes('.')) {
    return
  }

  return { kind: 'journal', journal }
}

export const openeditionHandler: PlatformHandler = {
  match: (url) => {
    return parseOpeneditionUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseOpeneditionUrl(url)

    if (!parsed) {
      return []
    }

    const params = { journal: parsed.journal }

    return [
      feeds.getFeedEntry('documents', params),
      feeds.getFeedEntry('issues', params),
      feeds.getFeedEntry('reviews', params),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}

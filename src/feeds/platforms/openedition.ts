import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers journal.

export type OpeneditionUrl = { kind: 'journal'; journal: string }

const hosts = ['journals.openedition.org']

// Each feed also answers at `backend.html` and at the journal home with `page=backend`.
const feeds = definePlatformFeeds([
  {
    key: 'openedition:documents',
    template: 'https://journals.openedition.org/{journal}/backend?format=rssdocuments',
  },
  {
    key: 'openedition:documents',
    template: 'https://journals.openedition.org/{journal}/backend.html?format=rssdocuments',
  },
  {
    key: 'openedition:documents',
    template: 'https://journals.openedition.org/{journal}/?page=backend&format=rssdocuments',
  },
  {
    key: 'openedition:issues',
    template: 'https://journals.openedition.org/{journal}/backend?format=rssnumeros',
  },
  {
    key: 'openedition:issues',
    template: 'https://journals.openedition.org/{journal}/backend.html?format=rssnumeros',
  },
  {
    key: 'openedition:issues',
    template: 'https://journals.openedition.org/{journal}/?page=backend&format=rssnumeros',
  },
  {
    key: 'openedition:reviews',
    template: 'https://journals.openedition.org/{journal}/backend?format=rssdocuments&type=review',
  },
  {
    key: 'openedition:reviews',
    template:
      'https://journals.openedition.org/{journal}/backend.html?format=rssdocuments&type=review',
  },
  {
    key: 'openedition:reviews',
    template:
      'https://journals.openedition.org/{journal}/?page=backend&format=rssdocuments&type=review',
  },
])

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
      feeds.getFeedEntry('openedition:documents', params),
      feeds.getFeedEntry('openedition:issues', params),
      feeds.getFeedEntry('openedition:reviews', params),
    ]
  },

  getFeedKey: feeds.getFeedKey,
}

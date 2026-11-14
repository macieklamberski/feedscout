import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers journal.

export type OpeneditionUrl = { kind: 'journal'; journal: string }

const hosts = ['journals.openedition.org']

// Each feed also answers at `backend.html` and at the journal home with `page=backend`. The
// documents feed narrows to one entity, such as an issue, by `identity`, and to one index entry
// by `idcontainer`. The page URL does not say which kind of entity it shows, and an article id
// gives an empty feed, so those two are claimed and never built.
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
    key: 'openedition:entity',
    template:
      'https://journals.openedition.org/{journal}/backend?format=rssdocuments&identity={entity}',
  },
  {
    key: 'openedition:index-entry',
    template:
      'https://journals.openedition.org/{journal}/backend?format=rssdocuments&idcontainer={entry}',
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

  getFeedHint: feeds.getFeedHint,
}

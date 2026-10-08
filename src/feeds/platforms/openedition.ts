import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type OpeneditionUrl = { kind: 'journal'; journal: string }

const hosts = ['journals.openedition.org']

// Top-level routes of the journals host that are not journals.
const excludedPaths = [
  'docannexe',
  'feed.php',
  'lodel',
  'oai',
  'oaipartenaires',
  'searchopeneditionorg',
  'wwwlodelorg', // The Lodel software site, which serves its own feeds
  'wwwmaisondesrevuesorg',
  'wwwopeneditionorg',
  'wwwrevuesorg',
]

export const parseOpeneditionUrl = (url: string): OpeneditionUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [journal] = getPathSegments(url)

  if (!journal) {
    return
  }

  if (isAnyOf(journal, excludedPaths)) {
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

    const backendUrl = `https://journals.openedition.org/${parsed.journal}/backend`

    return [
      {
        uri: `${backendUrl}?format=rssdocuments`,
        hint: composeHint('openedition:documents'),
      },
      {
        uri: `${backendUrl}?format=rssnumeros`,
        hint: composeHint('openedition:issues'),
      },
      {
        uri: `${backendUrl}?format=rssdocuments&type=review`,
        hint: composeHint('openedition:reviews'),
      },
    ]
  },
}

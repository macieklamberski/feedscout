import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['sverigesradio.se', 'www.sverigesradio.se']

const programIdRegex = /^\d+$/
const slugRegex = /^[a-z0-9-]+$/i

const excludedPaths = [
  'artikel',
  'avsnitt',
  'dist',
  'grupp',
  'kanaler',
  'kanalprogramlista',
  'kategori',
  'nyheter',
  'nyhetssok',
  'poddar',
  'poddar-program',
  'sida',
  'sok',
  'tema',
  'topsy',
  'trafiken',
]

export const sverigesRadioHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const programId = new URL(url).searchParams.get('programid')

    // Legacy pages such as /sida/default.aspx?programid={id} name the program by its id alone.
    if (programId && programIdRegex.test(programId)) {
      return [
        {
          uri: `https://api.sr.se/api/rss/program/${programId}`,
          hint: composeHint('sverigesRadio:program'),
        },
      ]
    }

    const [slug] = getPathSegments(url)

    if (!slug || !slugRegex.test(slug) || isAnyOf(slug, excludedPaths)) {
      return []
    }

    // public-api.sr.se answers 404 to a slug with an uppercase letter.
    return [
      {
        uri: `https://public-api.sr.se/rss/${slug.toLowerCase()}`,
        hint: composeHint('sverigesRadio:program'),
      },
    ]
  },
}

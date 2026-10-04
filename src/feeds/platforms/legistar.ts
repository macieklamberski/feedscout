import { isSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type LegistarUrl =
  | { kind: 'legislation'; id: string; guid: string }
  | { kind: 'meeting'; id: string; guid: string }

const domains = ['legistar.com']

const legislationPathRegex = /^\/LegislationDetail\.aspx$/i
const meetingPathRegex = /^\/MeetingDetail\.aspx$/i
const idRegex = /^\d+$/
const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const parseLegistarUrl = (url: string): LegistarUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isSubdomainOf(parsedUrl, domains)) {
    return
  }

  const id = parsedUrl.searchParams.get('ID')
  const guid = parsedUrl.searchParams.get('GUID')

  // Feed.ashx answers 410 to an id without its own GUID, so both must come from the page URL.
  if (!id || !guid || !idRegex.test(id) || !guidRegex.test(guid)) {
    return
  }

  if (legislationPathRegex.test(parsedUrl.pathname)) {
    return { kind: 'legislation', id, guid }
  }

  if (!meetingPathRegex.test(parsedUrl.pathname)) {
    return
  }

  return { kind: 'meeting', id, guid }
}

export const legistarHandler: PlatformHandler = {
  match: (url) => {
    return parseLegistarUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLegistarUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const query = `ID=${parsed.id}&GUID=${parsed.guid}`

    if (parsed.kind === 'legislation') {
      return [
        {
          uri: `${origin}/Feed.ashx?M=LD&${query}`,
          hint: composeHint('legistar:legislation'),
        },
      ]
    }

    return [
      {
        uri: `${origin}/Feed.ashx?M=CalendarDetail&${query}`,
        hint: composeHint('legistar:meeting'),
      },
    ]
  },
}

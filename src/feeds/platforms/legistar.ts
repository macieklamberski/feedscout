import { isSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type LegistarUrl =
  | { kind: 'legislation'; id: string; guid: string }
  | { kind: 'meeting'; id: string; guid: string }

const domains = ['legistar.com']

const legislationPathRegex = /^\/LegislationDetail\.aspx$/i
const meetingPathRegex = /^\/MeetingDetail\.aspx$/i
const idRegex = /^\d+$/
const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Legistar's load balancer sets this cookie on every page, on a client's custom domain too.
const cookieName = 'BIGipServerinsite.legistar.com_443'

// Every page loads the share widget under Legistar's own account, on a custom domain too.
export const isLegistarHtml = (content: string): boolean => {
  return content.includes('addthis_widget.js#username=legistarinsite')
}

export const isLegistarHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes(cookieName)
}

export const parseLegistarUrl = (url: string): LegistarUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
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
  match: (url, content, headers) => {
    if (
      !isSubdomainOf(url, domains) &&
      !hasMarker(content, headers, { html: isLegistarHtml, headers: isLegistarHeaders })
    ) {
      return false
    }

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

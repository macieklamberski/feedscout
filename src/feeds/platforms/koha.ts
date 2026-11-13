import { composeQuery, getQueryParam, getQueryParamValues, isAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, digitsRegex, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers comments, search (html).
// Handler needed for: list.

const domains = ['kohacatalog.com']

const scriptRegex =
  /^(?<root>.*)\/cgi-bin\/koha\/(?<script>opac-search|opac-shelves|opac-showreviews)\.pl$/i

// The feed link Koha prints drops the page's paging and sort for the newest acquisitions.
const searchPageParams = ['count', 'format', 'offset', 'sort_by']

// A feed takes the install root and a search its query from the page, which no template holds, so
// resolve builds them and the table only claims a feed of a catalog on kohacatalog.com.
const ownFeeds = definePlatformFeeds(
  [
    {
      key: 'koha:search',
      template: '{scheme}://{host}/cgi-bin/koha/opac-search.pl?format=rss',
    },
    {
      key: 'koha:search',
      template: '{scheme}://{host}/cgi-bin/koha/opac-search.pl?format=rss2',
    },
    {
      key: 'koha:list',
      template:
        '{scheme}://{host}/cgi-bin/koha/opac-shelves.pl?rss=1&op=view&shelfnumber={shelfNumber}',
    },
    {
      key: 'koha:comments',
      template: '{scheme}://{host}/cgi-bin/koha/opac-showreviews.pl?format=rss',
    },
  ],
  { domains },
)

export type KohaUrl =
  | { kind: 'search'; root: string; params: string }
  | { kind: 'list'; root: string; shelfNumber: string }
  | { kind: 'comments'; root: string }

// Every OPAC theme loads its assets from the install's `/opac-tmpl/` directory.
export const isKohaHtml = (content: string): boolean => {
  return content.includes('/opac-tmpl/')
}

export const parseKohaUrl = (url: string): KohaUrl | undefined => {
  const parsedUrl = parseUrl(url)
  const { root, script } = parsedUrl?.pathname.match(scriptRegex)?.groups ?? {}

  if (!parsedUrl || root === undefined || !script) {
    return
  }

  const params = parsedUrl.searchParams
  const page = script.toLowerCase()

  if (page === 'opac-search') {
    const terms = [...getQueryParamValues(params, 'q'), ...getQueryParamValues(params, 'limit')]

    if (terms.length === 0) {
      return
    }

    const searchParams = new URLSearchParams()

    for (const [name, value] of params) {
      if (!isAnyOf(name, searchPageParams)) {
        searchParams.append(name, value)
      }
    }

    return { kind: 'search', root, params: searchParams.toString() }
  }

  if (page === 'opac-shelves') {
    const shelfNumber = getQueryParam(params, 'shelfnumber')

    if (!shelfNumber || !digitsRegex.test(shelfNumber)) {
      return
    }

    return { kind: 'list', root, shelfNumber }
  }

  return { kind: 'comments', root }
}

export const kohaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isKohaHtml })) {
      return false
    }

    return parseKohaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseKohaUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const scriptsUrl = `${origin}${parsed.root}/cgi-bin/koha`

    if (parsed.kind === 'search') {
      // 50 is the default of numSearchRSSResults, the preference Koha prints as the feed's count.
      const searchUrl = `${scriptsUrl}/opac-search.pl?${parsed.params}&count=50&sort_by=acqdate_dsc`

      return [
        {
          // Koha 18.05 and older serve the search feed only as `format=rss2`.
          uri: [`${searchUrl}&format=rss`, `${searchUrl}&format=rss2`],
          hint: composeHint('koha:search'),
        },
      ]
    }

    if (parsed.kind === 'list') {
      const params = composeQuery({ rss: '1', op: 'view', shelfnumber: parsed.shelfNumber })

      return [{ uri: `${scriptsUrl}/opac-shelves.pl${params}`, hint: composeHint('koha:list') }]
    }

    return [
      {
        uri: `${scriptsUrl}/opac-showreviews.pl?format=rss`,
        hint: composeHint('koha:comments'),
      },
    ]
  },

  getFeedHint: ownFeeds.getFeedHint,
}

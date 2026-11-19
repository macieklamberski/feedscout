import { yeswiki } from 'feedintel'
import { parseJson } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  digitsRegex,
  type Element,
  findElements,
  getCookieNames,
  hasClass,
  hasMarker,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: recent-changes.
// Handler needed for: entries, form-entries.

export type YeswikiPage = { installPath: string; formIds: Array<string> }

type BazarListParams = { idtypeannonce?: string | Array<string>; externalModeActivated?: boolean }

const sessionCookieRegex = /^YesWiki-/
const sessionCookiePathRegex = /(?:^|,)\s*YesWiki-[^=]+=[^,]*?;\s*path=([^;,\s]+)/i
const formClassRegex = /^id(\d+)$/
const whitespaceRegex = /\s+/

const formElementClasses = ['BAZ_cadre_fiche', 'bazar-entry', 'bazar-list-dynamic-container']

const feeds = withHintLabels(yeswiki.feeds)

// YesWiki names its session `YesWiki-main`, or `YesWiki-{path}` under a sub-path.
export const isYeswikiHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => sessionCookieRegex.test(name))
}

const parseListParams = (value: string | undefined): BazarListParams | undefined => {
  return parseJson<BazarListParams>(value)
}

const readFormIds = (element: Element): Array<string> => {
  if (hasClass(element, 'BAZ_cadre_fiche')) {
    return element.attribs.class.split(whitespaceRegex).flatMap((className) => {
      return className.match(formClassRegex)?.[1] ?? []
    })
  }

  if (hasClass(element, 'bazar-entry')) {
    return [element.attribs['data-id_typeannonce'] ?? '']
  }

  const params = parseListParams(element.attribs['data-params'])

  // An external list shows another wiki's forms.
  if (!params || params.externalModeActivated) {
    return []
  }

  return [params.idtypeannonce ?? []].flat().map(String)
}

// A made-up form id still answers with a placeholder feed, so ids come only from what the page
// shows: an entry inside `BAZ_cadre_fiche id{form}`, a static list entry's `data-id_typeannonce`
// and a dynamic list's `data-params`.
const getFormIds = (content: string | undefined): Array<string> => {
  if (!content) {
    return []
  }

  const formIds: Array<string> = []
  const elements = findElements(content, (element) => {
    return formElementClasses.some((className) => hasClass(element, className))
  })

  for (const element of elements) {
    for (const formId of readFormIds(element)) {
      if (digitsRegex.test(formId) && !formIds.includes(formId)) {
        formIds.push(formId)
      }
    }
  }

  return formIds
}

// The session cookie is scoped to the install root.
const getYeswikiPage = (content: string | undefined, headers: Headers | undefined): YeswikiPage => {
  return {
    installPath: headers?.get('set-cookie')?.match(sessionCookiePathRegex)?.[1] ?? '/',
    formIds: getFormIds(content),
  }
}

export const yeswikiHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { headers: isYeswikiHeaders })
  },

  resolve: (url, content, headers) => {
    const { installPath, formIds } = getYeswikiPage(content, headers)
    const root = `${new URL(url).origin}${installPath}`

    return [
      ...formIds.map((formId) => feeds.getFeedEntry('form-entries', { root, formId })),
      feeds.getFeedEntry('entries', { root }),
      feeds.getFeedEntry('recent-changes', { root }),
    ]
  },
}

import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const layoutAssetRegex = /^\/Areas\/Layout\/Assets\//

type CivicplusModule = { query: Record<string, string>; hint: string }

// The all-categories feed of each module that serves one. A module id with no feed answers 200
// with an empty body.
const modules: Array<CivicplusModule> = [
  { query: { ModID: '1', CID: 'All-newsflash.xml' }, hint: 'civicplus:news-flash' },
  { query: { ModID: '51', CID: 'All-blog.xml' }, hint: 'civicplus:blog' },
  { query: { ModID: '53', CID: 'All-0' }, hint: 'civicplus:photo-gallery' },
  { query: { ModID: '58', CID: 'All-calendar.xml' }, hint: 'civicplus:calendar' },
  { query: { ModID: '63', CID: 'All-0' }, hint: 'civicplus:alert-center' },
  { query: { ModID: '64', CID: 'All-0' }, hint: 'civicplus:real-estate' },
  { query: { ModID: '65', CID: 'All-0' }, hint: 'civicplus:agenda-center' },
  { query: { ModID: '66', CID: 'All-0', CommunityJobs: 'False' }, hint: 'civicplus:jobs' },
  { query: { ModID: '92', CID: 'All-civicmedia.xml' }, hint: 'civicplus:media-center' },
]

// The site-wide feed of new and updated pages, for the home page and content pages.
const pagesModule: CivicplusModule = {
  query: { ModID: '76', CID: 'All-0' },
  hint: 'civicplus:pages',
}

export type CivicplusPage = { kind: 'module'; origin: string; module: CivicplusModule }

export const isCivicplusHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && layoutAssetRegex.test(element.attribs.src ?? '')
  })

  return script !== undefined
}

export const isCivicplusHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('CP_IsMobile')
}

// Every module page prints its module id in a hidden `pageModuleID` input, left empty on the
// home page and on content pages. A page with no module feed gets the site-wide Pages feed.
const getCivicplusPage = (url: string, content: string | undefined): CivicplusPage => {
  const input = findElement(content, (element) => {
    return element.name === 'input' && element.attribs.id === 'pageModuleID'
  })
  const pageModule = modules.find(({ query }) => query.ModID === input?.attribs.value)

  return { kind: 'module', origin: new URL(url).origin, module: pageModule ?? pagesModule }
}

export const civicplusHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isCivicplusHtml, headers: isCivicplusHeaders })
  },

  resolve: (url, content) => {
    const page = getCivicplusPage(url, content)

    return [
      {
        uri: `${page.origin}/RSSFeed.aspx?${new URLSearchParams(page.module.query)}`,
        hint: composeHint(page.module.hint),
      },
    ]
  },
}

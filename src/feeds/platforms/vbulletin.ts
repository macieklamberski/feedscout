import { vbulletin, vbulletinLegacy } from 'feedintel'
import { endsWithAnyOf, getOrigin, getQueryParam, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  digitsRegex,
  findElement,
  getCookieNames,
  getScriptDirectory,
  hasMarker,
} from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type VbulletinPage = { version: 4 | 5; root: string; forumId?: string }

const coreScriptRegex = /\/clientscript\/vbulletin-core\.js/i
const clientscriptPathRegex = /\/clientscript\/.*$/i
const rollupScriptRegex = /(?:^|\/)js\/header-rollup(?:-\d+)?\.js/i
const rollupPathRegex = /\/js\/[^/]*$/i
// vBulletin 5 and 6.0 print `"channelid": "{id}"` in `pageData`,
// 6.1 and later `data-channelid='{id}'`.
const channelIdRegex = /(?:"channelid":\s*"|data-channelid=['"])(\d+)/
const friendlyForumIdRegex = /^\?(\d+)(?:-|&|$)/

const vbulletinFeeds = withHintLabels(vbulletin.feeds)
const vbulletinLegacyFeeds = withHintLabels(vbulletinLegacy.feeds)

// vBulletin 4 prints `clientscript/vbulletin-core.js` as an absolute URL under the forum root.
// vBulletin 5 and 6 print `js/header-rollup-{version}.js` or `js/header-rollup.js?c={hash}`
// relative to a `<base>` at the root.
const getScriptSrc = (content: string | undefined, srcRegex: RegExp): string | undefined => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && srcRegex.test(element.attribs.src ?? '')
  })

  return script?.attribs.src
}

export const isVbulletinHtml = (content: string): boolean => {
  return (
    getScriptSrc(content, coreScriptRegex) !== undefined ||
    getScriptSrc(content, rollupScriptRegex) !== undefined
  )
}

// vBulletin 3 to 6 set `{prefix}lastvisit` and `{prefix}lastactivity`, the board picks the prefix.
export const isVbulletinHeaders = (headers: Headers): boolean => {
  const names = getCookieNames(headers)

  return names.some((name) => {
    if (!name.endsWith('lastvisit')) {
      return false
    }

    const prefix = name.slice(0, -'lastvisit'.length)

    return names.includes(`${prefix}lastactivity`)
  })
}

// Friendly URLs name the forum as `?{id}-{title}` or `?{id}`, and plain ones as `?f={id}`.
const getForumId = (parsedUrl: URL): string | undefined => {
  if (!endsWithAnyOf(parsedUrl.pathname, '/forumdisplay.php')) {
    return
  }

  const forumId =
    getQueryParam(parsedUrl.searchParams, 'f') ?? friendlyForumIdRegex.exec(parsedUrl.search)?.[1]

  if (forumId && digitsRegex.test(forumId)) {
    return forumId
  }
}

// vBulletin 5 and 6 serve `external?type=rss2` and have no `external.php`.
const getVbulletin5Page = (url: string, content: string | undefined): VbulletinPage | undefined => {
  const rollupScriptSrc = getScriptSrc(content, rollupScriptRegex)

  if (!rollupScriptSrc) {
    return
  }

  const baseElement = findElement(content, (element) => {
    return element.name === 'base'
  })
  const baseUrl = parseUrl(baseElement?.attribs.href, url) ?? url
  // biome-ignore lint/plugin/noBareNewUrl: A malformed href throws, which reports it to onError.
  const rollupScriptUrl = new URL(rollupScriptSrc, baseUrl)
  const rollupOrigin = getOrigin(rollupScriptUrl)

  if (!rollupOrigin) {
    return
  }

  const root = `${rollupOrigin}${rollupScriptUrl.pathname.replace(rollupPathRegex, '')}`
  const channelId = content?.match(channelIdRegex)?.[1]

  // The root channel, id 1, serves the same items as the site feed.
  if (channelId && channelId !== '1') {
    return { version: 5, root, forumId: channelId }
  }

  return { version: 5, root }
}

// A rewritten page URL such as `/other-gps-systems.html` names no install root.
const getVbulletin4RootUrl = (parsedUrl: URL, content: string | undefined): string => {
  const coreScriptSrc = getScriptSrc(content, coreScriptRegex)
  const coreScriptUrl = coreScriptSrc ? parseUrl(coreScriptSrc, parsedUrl) : undefined
  const coreScriptOrigin = getOrigin(coreScriptUrl)

  if (coreScriptUrl && coreScriptOrigin) {
    return `${coreScriptOrigin}${coreScriptUrl.pathname.replace(clientscriptPathRegex, '')}`
  }

  return `${parsedUrl.origin}${getScriptDirectory(parsedUrl.pathname)}`
}

const getVbulletinPage = (url: string, content: string | undefined): VbulletinPage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const vbulletin5Page = getVbulletin5Page(url, content)

  if (vbulletin5Page) {
    return vbulletin5Page
  }

  return {
    version: 4,
    root: getVbulletin4RootUrl(parsedUrl, content),
    forumId: getForumId(parsedUrl),
  }
}

export const vbulletinHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isVbulletinHtml, headers: isVbulletinHeaders })
  },

  resolve: (url, content) => {
    const page = getVbulletinPage(url, content)

    if (!page) {
      return []
    }

    const feeds = page.version === 5 ? vbulletinFeeds : vbulletinLegacyFeeds

    if (page.forumId) {
      return [
        feeds.getFeedEntry('forum', { root: page.root, forumId: page.forumId }),
        feeds.getFeedEntry('site', { root: page.root }),
      ]
    }

    return [feeds.getFeedEntry('site', { root: page.root })]
  },
}

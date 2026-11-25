import { drupal } from 'feedintel'
import { DomUtils } from 'htmlparser2'
import { includesAnyOf, isString } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker, hasMetaContent } from '../../common/utils.js'
import { isGcsWebPage } from './gcsWeb.js'

// Discoverability: Discoverable without handler.

type DrupalSettings = { path?: { baseUrl?: unknown } }

const feeds = withHintLabels(drupal.feeds)

export const isDrupalHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Drupal')
}

export const isDrupalHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('x-generator'), 'drupal')
}

export type DrupalPage = { kind: 'site'; base?: Array<string> }

// Drupal 8 and later print the install's base path in the settings JSON of every page.
const getBasePath = (content: string | undefined): string | undefined => {
  const script = findElement(content, (element) => {
    return (
      element.name === 'script' &&
      element.attribs['data-drupal-selector'] === 'drupal-settings-json'
    )
  })

  if (!script) {
    return
  }

  try {
    const settings: DrupalSettings = JSON.parse(DomUtils.textContent(script))
    const basePath = settings.path?.baseUrl

    if (isString(basePath)) {
      return basePath
    }
  } catch {}
}

// A page outside the base path its settings print is read at the root of its host.
export const getDrupalPage = (url: string, content: string | undefined): DrupalPage | undefined => {
  const basePath = getBasePath(content)
  const basePage = basePath === undefined ? undefined : drupal.pages.read(url, { base: basePath })
  const page = basePage ?? drupal.pages.read(url, { isAnyHost: true })

  if (!page) {
    return
  }

  return { kind: 'site', base: page.params.base }
}

export const drupalHandler: PlatformHandler = {
  match: (url, content, headers) => {
    // GCS-web sites run on Drupal, and the GCS-web handler emits their feeds.
    if (isGcsWebPage(url, content)) {
      return false
    }

    return hasMarker(content, headers, { html: isDrupalHtml, headers: isDrupalHeaders })
  },

  resolve: (url, content) => {
    const page = getDrupalPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('site', { base: page.base })]
  },
}

import { DomUtils } from 'htmlparser2'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker, hasMetaContent } from '../../common/utils.js'
import { isGcsWebHtml } from './gcsWeb.js'

// Discoverability: Discoverable without handler.

type DrupalSettings = { path?: { baseUrl?: unknown } }

const drupalRegex = /drupal/i

export const isDrupalHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Drupal')
}

export const isDrupalHeaders = (headers: Headers): boolean => {
  return drupalRegex.test(headers.get('x-generator') ?? '')
}

export type DrupalPage = { kind: 'site'; baseUrl: string }

// Drupal 8 and later print the install's base path in the settings JSON of every page.
export const getDrupalPage = (url: string, content: string | undefined): DrupalPage => {
  const { origin } = new URL(url)
  const script = findElement(content, (element) => {
    return (
      element.name === 'script' &&
      element.attribs['data-drupal-selector'] === 'drupal-settings-json'
    )
  })

  if (script) {
    try {
      const settings: DrupalSettings = JSON.parse(DomUtils.textContent(script))
      const basePath = settings.path?.baseUrl

      if (typeof basePath === 'string' && basePath.startsWith('/') && basePath.endsWith('/')) {
        return { kind: 'site', baseUrl: `${origin}${basePath}` }
      }
    } catch {}
  }

  return { kind: 'site', baseUrl: `${origin}/` }
}

export const drupalHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    // GCS-web sites run on Drupal, and the GCS-web handler emits their feeds.
    if (content && isGcsWebHtml(content)) {
      return false
    }

    return hasMarker(content, headers, { html: isDrupalHtml, headers: isDrupalHeaders })
  },

  resolve: (url, content) => {
    const page = getDrupalPage(url, content)

    return [{ uri: `${page.baseUrl}rss.xml`, hint: composeHint('drupal:site') }]
  },
}

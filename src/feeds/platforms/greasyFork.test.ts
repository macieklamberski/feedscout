import { describe, expect, it } from 'bun:test'
import type { GreasyForkPage, GreasyForkUrl } from './greasyFork.js'
import { getGreasyForkPage, greasyForkHandler, parseGreasyForkUrl } from './greasyFork.js'

const scriptPage = `
  <dl>
    <dt class="script-show-author"><span>Author</span></dt>
    <dd class="script-show-author"><span><a href="/en/users/6117-junkblocker">junkblocker</a></span></dd>
  </dl>
`

describe('parseGreasyForkUrl', () => {
  it('should return the user for a user page', () => {
    const expected: GreasyForkUrl = { kind: 'user', locale: 'en', userId: '1' }

    expect(parseGreasyForkUrl('https://greasyfork.org/en/users/1-jasonbarnabe')).toEqual(expected)
  })

  it('should return the user for a user page with an encoded name', () => {
    const value =
      'https://greasyfork.org/en/users/1019277-%E6%B5%81%E8%90%A4%E5%8F%AF%E7%88%B1%E6%8D%8F'
    const expected: GreasyForkUrl = { kind: 'user', locale: 'en', userId: '1019277' }

    expect(parseGreasyForkUrl(value)).toEqual(expected)
  })

  it('should keep the locale of a user page', () => {
    const expected: GreasyForkUrl = { kind: 'user', locale: 'zh-CN', userId: '1076667' }

    expect(parseGreasyForkUrl('https://greasyfork.org/zh-CN/users/1076667-schimon')).toEqual(
      expected,
    )
  })

  it('should keep a locale with a numeric region', () => {
    const expected: GreasyForkUrl = { kind: 'user', locale: 'es-419', userId: '1' }

    expect(parseGreasyForkUrl('https://greasyfork.org/es-419/users/1-jasonbarnabe')).toEqual(
      expected,
    )
  })

  it('should return the user in English for a user page without a locale', () => {
    const expected: GreasyForkUrl = { kind: 'user', locale: 'en', userId: '1' }

    expect(parseGreasyForkUrl('https://greasyfork.org/users/1-jasonbarnabe')).toEqual(expected)
  })

  it('should return the user for a user page with a capitalized users segment', () => {
    const expected: GreasyForkUrl = { kind: 'user', locale: 'en', userId: '1' }

    expect(parseGreasyForkUrl('https://greasyfork.org/en/Users/1-jasonbarnabe')).toEqual(expected)
  })

  it('should return the script for a script page', () => {
    const value = 'https://greasyfork.org/en/scripts/6261-rss-atom-feed-subscribe-button-generator'
    const expected: GreasyForkUrl = { kind: 'script', locale: 'en' }

    expect(parseGreasyForkUrl(value)).toEqual(expected)
  })

  it('should return the script for a script feedback page', () => {
    const value =
      'https://greasyfork.org/en/scripts/6261-rss-atom-feed-subscribe-button-generator/feedback'
    const expected: GreasyForkUrl = { kind: 'script', locale: 'en' }

    expect(parseGreasyForkUrl(value)).toEqual(expected)
  })

  it('should return the home page for a script listing', () => {
    const expected: GreasyForkUrl = { kind: 'home', locale: 'en' }

    expect(parseGreasyForkUrl('https://greasyfork.org/en/scripts?sort=updated')).toEqual(expected)
  })

  it('should return the home page for a user route without an id', () => {
    const expected: GreasyForkUrl = { kind: 'home', locale: 'en' }

    expect(parseGreasyForkUrl('https://greasyfork.org/en/users/sign_in')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: GreasyForkUrl = { kind: 'home', locale: 'en' }

    expect(parseGreasyForkUrl('https://greasyfork.org/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseGreasyForkUrl('https://example.com/en/users/1-jasonbarnabe')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseGreasyForkUrl('not a url')).toBeUndefined()
  })
})

describe('getGreasyForkPage', () => {
  it('should return the author of a script page', () => {
    const value = 'https://greasyfork.org/en/scripts/6261-rss-atom-feed-subscribe-button-generator'
    const expected: GreasyForkPage = { kind: 'user', locale: 'en', userId: '6117' }

    expect(getGreasyForkPage(value, scriptPage)).toEqual(expected)
  })

  it('should return undefined for a script page without an author', () => {
    const value =
      'https://greasyfork.org/en/scripts/6261-rss-atom-feed-subscribe-button-generator/feedback'

    expect(getGreasyForkPage(value, '<div class="script-discussion-list"></div>')).toBeUndefined()
  })

  it('should return undefined for a script page without content', () => {
    const value = 'https://greasyfork.org/en/scripts/6261-rss-atom-feed-subscribe-button-generator'

    expect(getGreasyForkPage(value, undefined)).toBeUndefined()
  })
})

describe('greasyForkHandler', () => {
  describe('match', () => {
    it('should match a Greasy Fork page', () => {
      expect(greasyForkHandler.match('https://greasyfork.org/en/users/1-jasonbarnabe')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(greasyForkHandler.match('https://example.com/en/users/1-jasonbarnabe')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Greasy Fork', () => {
      expect(greasyForkHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the user scripts feed for a user page', () => {
      const value = 'https://greasyfork.org/zh-CN/users/1076667-schimon'
      const expected = [
        {
          uri: 'https://api.greasyfork.org/zh-CN/scripts.atom?by=1076667&filter_locale=0',
          hint: { key: 'greasy-fork:user', label: 'User scripts' },
        },
      ]

      expect(greasyForkHandler.resolve(value)).toEqual(expected)
    })

    it('should return the user scripts feed on the Sleazy Fork api host', () => {
      const value = 'https://sleazyfork.org/en/users/989635-canaan-hs'
      const expected = [
        {
          uri: 'https://api.sleazyfork.org/en/scripts.atom?by=989635&filter_locale=0',
          hint: { key: 'greasy-fork:user', label: 'User scripts' },
        },
      ]

      expect(greasyForkHandler.resolve(value)).toEqual(expected)
    })

    it('should return the author scripts feed for a script page', () => {
      const value =
        'https://greasyfork.org/en/scripts/6261-rss-atom-feed-subscribe-button-generator'
      const expected = [
        {
          uri: 'https://api.greasyfork.org/en/scripts.atom?by=6117&filter_locale=0',
          hint: { key: 'greasy-fork:user', label: 'User scripts' },
        },
      ]

      expect(greasyForkHandler.resolve(value, scriptPage)).toEqual(expected)
    })

    it('should return the site feeds for any other page', () => {
      const value = 'https://greasyfork.org/de/scripts'
      const expected = [
        {
          uri: 'https://api.greasyfork.org/de/scripts.atom?sort=created',
          hint: { key: 'greasy-fork:new', label: 'New scripts' },
        },
        {
          uri: 'https://api.greasyfork.org/de/scripts.atom?sort=updated',
          hint: { key: 'greasy-fork:updated', label: 'Updated scripts' },
        },
      ]

      expect(greasyForkHandler.resolve(value)).toEqual(expected)
    })
  })
})

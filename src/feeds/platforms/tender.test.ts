import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  getTenderPage,
  isTenderHeaders,
  isTenderHtml,
  type TenderPage,
  tenderHandler,
} from './tender.js'

const settingsHtml = `
  <script type="text/javascript" charset="utf-8">
    Tender = {"mobile":false,"logged_in":false,"kb_enabled":true,"user_id":0,"root":"/","discussion_editable":null};
  </script>
`
const helpSettingsHtml = `
  <script type="text/javascript" charset="utf-8">
    Tender = {"mobile":false,"logged_in":false,"kb_enabled":true,"user_id":0,"root":"/help/","discussion_editable":null};
  </script>
`
const sessionHeaders = new Headers({
  'set-cookie': '_tender19_session=BAh7B0kiD3Nlc3Npb25f; path=/; HttpOnly',
})

describe('isTenderHtml', () => {
  it('should return true for the settings script', () => {
    expect(isTenderHtml(settingsHtml)).toBe(true)
  })

  it('should return false for another page', () => {
    expect(isTenderHtml('<script>var settings = {"root":"/"};</script>')).toBe(false)
  })
})

describe('isTenderHeaders', () => {
  it('should return true for the session cookie', () => {
    expect(isTenderHeaders(sessionHeaders)).toBe(true)
  })

  it('should return false for another session cookie', () => {
    const value = new Headers({ 'set-cookie': '_example_session=abc; path=/' })

    expect(isTenderHeaders(value)).toBe(false)
  })
})

describe('getTenderPage', () => {
  it('should return the site for the home page', () => {
    const expected: TenderPage = { kind: 'site', siteUrl: 'https://alice.tenderapp.com' }

    expect(getTenderPage('https://alice.tenderapp.com/', settingsHtml)).toEqual(expected)
  })

  it('should return the discussion for a discussion page', () => {
    const value = 'https://alice.tenderapp.com/discussions/questions/1234-sync-is-stuck'
    const expected: TenderPage = {
      kind: 'discussion',
      siteUrl: 'https://alice.tenderapp.com',
      category: 'questions',
      discussion: '1234-sync-is-stuck',
    }

    expect(getTenderPage(value, settingsHtml)).toEqual(expected)
  })

  it('should return the site for a category page', () => {
    const value = 'https://alice.tenderapp.com/discussions/questions'
    const expected: TenderPage = { kind: 'site', siteUrl: 'https://alice.tenderapp.com' }

    expect(getTenderPage(value, settingsHtml)).toEqual(expected)
  })

  it('should return the site for a path that names no discussion', () => {
    const value = 'https://alice.tenderapp.com/discussions/questions/new'
    const expected: TenderPage = { kind: 'site', siteUrl: 'https://alice.tenderapp.com' }

    expect(getTenderPage(value, settingsHtml)).toEqual(expected)
  })

  it('should return the site under the root the settings script names', () => {
    const expected: TenderPage = { kind: 'site', siteUrl: 'https://alice.tenderapp.com/help' }

    expect(getTenderPage('https://alice.tenderapp.com/', helpSettingsHtml)).toEqual(expected)
  })

  it('should return the discussion under the root the settings script names', () => {
    const value = 'https://alice.tenderapp.com/help/discussions/questions/138-refund'
    const expected: TenderPage = {
      kind: 'discussion',
      siteUrl: 'https://alice.tenderapp.com/help',
      category: 'questions',
      discussion: '138-refund',
    }

    expect(getTenderPage(value, helpSettingsHtml)).toEqual(expected)
  })

  it('should return the discussion under /help/ without content', () => {
    const value = 'https://alice.tenderapp.com/help/discussions/questions/138-refund'
    const expected: TenderPage = {
      kind: 'discussion',
      siteUrl: 'https://alice.tenderapp.com/help',
      category: 'questions',
      discussion: '138-refund',
    }

    expect(getTenderPage(value, undefined)).toEqual(expected)
  })

  it('should return the site at the origin without content', () => {
    const expected: TenderPage = { kind: 'site', siteUrl: 'https://alice.tenderapp.com' }

    expect(getTenderPage('https://alice.tenderapp.com/kb', undefined)).toEqual(expected)
  })

  it('should return the site for a page outside the root', () => {
    const expected: TenderPage = { kind: 'site', siteUrl: 'https://alice.tenderapp.com/help' }

    expect(getTenderPage('https://alice.tenderapp.com/about', helpSettingsHtml)).toEqual(expected)
  })

  it('should return the discussion on a custom domain', () => {
    const value = 'https://support.example.com/discussions/problems/960-build-stopped-working'
    const expected: TenderPage = {
      kind: 'discussion',
      siteUrl: 'https://support.example.com',
      category: 'problems',
      discussion: '960-build-stopped-working',
    }

    expect(getTenderPage(value, settingsHtml)).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(getTenderPage('https://tenderapp.com/', undefined)).toBeUndefined()
  })

  it('should return undefined for a dotted subdomain', () => {
    expect(getTenderPage('https://www.alice.tenderapp.com/', undefined)).toBeUndefined()
  })

  it('should return undefined for the www host', () => {
    expect(getTenderPage('https://www.tenderapp.com/', undefined)).toBeUndefined()
  })

  it('should return undefined for an error page', () => {
    const url = 'https://alice.tenderapp.com/discussions/no-such-category'
    const value = `
      ${settingsHtml}
      <body>
        <!-- This file lives in public/404.html -->
        <div class="dialog">
          <h1>The page you are looking for can't be found</h1>
        </div>
      </body>
    `

    expect(getTenderPage(url, value)).toBeUndefined()
  })

  it('should return undefined for the bare error text', () => {
    const url = 'https://alice.tenderapp.com/discussions/no-such-category'
    const value = "The page you are looking for can't be found"

    expect(getTenderPage(url, value)).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(getTenderPage('not-a-url', undefined)).toBeUndefined()
  })
})

describe('tenderHandler', () => {
  describe('match', () => {
    it('should return true for a site on tenderapp.com', () => {
      expect(tenderHandler.match('https://alice.tenderapp.com/')).toBe(true)
    })

    it('should return true for a custom domain with the settings script', () => {
      expect(tenderHandler.match('https://support.example.com/', settingsHtml)).toBe(true)
    })

    it('should return true for a custom domain with the session cookie', () => {
      expect(tenderHandler.match('https://support.example.com/', '', sessionHeaders)).toBe(true)
    })

    it('should return false for another page', () => {
      expect(tenderHandler.match('https://example.com/', '<html></html>')).toBe(false)
    })

    it('should return false for the www host', () => {
      expect(tenderHandler.match('https://www.tenderapp.com/', settingsHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should keep a discussion with & inside the discussion_id query value', () => {
      const value = 'https://alice.tenderapp.com/discussions/questions/1234-a&b'
      const expected = [
        {
          uri: 'https://alice.tenderapp.com/discussions/questions/1234-a&b.atom?discussion_id=1234-a%26b',
          hint: { key: 'tender:discussion', label: 'Discussion comments' },
        },
      ]

      expect(tenderHandler.resolve(value, settingsHtml)).toEqual(expected)
    })

    it('should keep an escaped discussion escaped once in the discussion_id query value', () => {
      const value = 'https://alice.tenderapp.com/discussions/questions/1234-a%2Bb'
      const expected = [
        {
          uri: 'https://alice.tenderapp.com/discussions/questions/1234-a%2Bb.atom?discussion_id=1234-a%2Bb',
          hint: { key: 'tender:discussion', label: 'Discussion comments' },
        },
      ]

      expect(tenderHandler.resolve(value, settingsHtml)).toEqual(expected)
    })

    it('should return the discussions and comments feeds for the home page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.tenderapp.com/discussions.atom',
          hint: { key: 'tender:discussions', label: 'Discussions' },
        },
        {
          uri: 'https://alice.tenderapp.com/comments/recent.atom',
          hint: { key: 'tender:comments', label: 'Recent comments' },
        },
      ]

      expect(tenderHandler.resolve('https://alice.tenderapp.com/', settingsHtml)).toEqual(expected)
    })

    it('should return the comments feed for a discussion page', () => {
      const value = 'https://alice.tenderapp.com/discussions/questions/1234-sync-is-stuck'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.tenderapp.com/discussions/questions/1234-sync-is-stuck.atom?discussion_id=1234-sync-is-stuck',
          hint: { key: 'tender:discussion', label: 'Discussion comments' },
        },
      ]

      expect(tenderHandler.resolve(value, settingsHtml)).toEqual(expected)
    })

    it('should return the site feeds under the root the settings script names', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.tenderapp.com/help/discussions.atom',
          hint: { key: 'tender:discussions', label: 'Discussions' },
        },
        {
          uri: 'https://alice.tenderapp.com/help/comments/recent.atom',
          hint: { key: 'tender:comments', label: 'Recent comments' },
        },
      ]

      expect(tenderHandler.resolve('https://alice.tenderapp.com/', helpSettingsHtml)).toEqual(
        expected,
      )
    })

    it('should return empty array for the www host', () => {
      expect(tenderHandler.resolve('https://www.tenderapp.com/')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the discussions key for the discussions feed', () => {
      const value = 'https://gpgtools.tenderapp.com/discussions.atom'
      const expected = 'tender:discussions'

      expect(tenderHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the comments key for the recent comments feed', () => {
      const value = 'https://gpgtools.tenderapp.com/comments/recent.atom'
      const expected = 'tender:comments'

      expect(tenderHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the discussion key for a discussion feed', () => {
      const value =
        'https://infinitekind.tenderapp.com/discussions/general-questions/135551-change-view.atom?discussion_id=135551-change-view'
      const expected = 'tender:discussion'

      expect(tenderHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the discussion key for a discussion feed without discussion_id', () => {
      const value =
        'https://infinitekind.tenderapp.com/discussions/general-questions/135551-change-view.atom'
      const expected = 'tender:discussion'

      expect(tenderHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the discussions key for the discussions feed under /help', () => {
      const value = 'https://the-unsigned-guide-2.tenderapp.com/help/discussions.atom'
      const expected = 'tender:discussions'

      expect(tenderHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the discussion key for a discussion feed under /help over http', () => {
      const value =
        'http://scrivener.tenderapp.com/help/discussions/scrivener-3-beta/890-translation-feedback-japanese.atom?discussion_id=890-translation-feedback-japanese'
      const expected = 'tender:discussion'

      expect(tenderHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a discussion page', () => {
      const value =
        'https://infinitekind.tenderapp.com/discussions/general-questions/135551-change-view'

      expect(tenderHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://support.example.com/discussions.atom'

      expect(tenderHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the www host', () => {
      const value = 'https://www.tenderapp.com/discussions.atom'

      expect(tenderHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a new discussion form under a category', () => {
      const value = 'https://alice.tenderapp.com/discussions/questions/new.atom'

      expect(tenderHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for an invalid URL', () => {
      const value = 'not a url'

      expect(tenderHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://gpgtools.tenderapp.com/discussions.atom',
        { key: 'tender:discussions', label: 'Discussions' },
      ],
      [
        'https://infinitekind.tenderapp.com/discussions.atom/',
        { key: 'tender:discussions', label: 'Discussions' },
      ],
      [
        'https://gpgtools.tenderapp.com/comments/recent.atom',
        { key: 'tender:comments', label: 'Recent comments' },
      ],
      [
        'https://gpgtools.tenderapp.com/comments/recent.atom/',
        { key: 'tender:comments', label: 'Recent comments' },
      ],
      [
        'https://infinitekind.tenderapp.com/discussions/general-questions/135551-change-view.atom?discussion_id=135551-change-view',
        { key: 'tender:discussion', label: 'Discussion comments' },
      ],
      [
        'https://infinitekind.tenderapp.com/discussions/problems/50-quicken-credit-card-and-chase.atom',
        { key: 'tender:discussion', label: 'Discussion comments' },
      ],
      [
        'https://infinitekind.tenderapp.com/discussions/general-questions/135551-change-view.atom/',
        { key: 'tender:discussion', label: 'Discussion comments' },
      ],
      [
        'http://scrivener.tenderapp.com/help/discussions/scrivener-3-beta/890-translation-feedback-japanese.atom?discussion_id=890-translation-feedback-japanese',
        { key: 'tender:discussion', label: 'Discussion comments' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [tenderHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})

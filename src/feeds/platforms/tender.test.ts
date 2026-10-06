import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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

  const serviceHosts = [
    'https://api.tenderapp.com/',
    'https://blog.tenderapp.com/',
    'https://setup.tenderapp.com/',
    'https://ssl.tenderapp.com/',
    'https://status.tenderapp.com/',
    'https://support.tenderapp.com/',
    'https://www.tenderapp.com/',
  ]

  it.each(serviceHosts)('should return undefined for service host %s', (value) => {
    expect(getTenderPage(value, undefined)).toBeUndefined()
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

    it('should return false for a service host', () => {
      expect(tenderHandler.match('https://www.tenderapp.com/', settingsHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the discussions feed for the home page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.tenderapp.com/discussions.atom',
          hint: { key: 'tender:discussions', label: 'Discussions' },
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

    it('should return the discussions feed under the root the settings script names', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.tenderapp.com/help/discussions.atom',
          hint: { key: 'tender:discussions', label: 'Discussions' },
        },
      ]

      expect(tenderHandler.resolve('https://alice.tenderapp.com/', helpSettingsHtml)).toEqual(
        expected,
      )
    })

    it('should return empty array for a service host', () => {
      expect(tenderHandler.resolve('https://www.tenderapp.com/')).toEqual([])
    })
  })
})

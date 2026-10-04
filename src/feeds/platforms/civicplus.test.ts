import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { civicplusHandler, isCivicplusHeaders, isCivicplusHtml } from './civicplus.js'

const layoutScript = `
  <script
    defer
    src="/Areas/Layout/Assets/Scripts/Search.js"
    type="text/javascript"
  ></script>
`
const newsFlashHtml = `
  ${layoutScript}
  <input
    type="hidden"
    id="pageModuleID"
    value="1"
  >
  <input
    type="hidden"
    id="pagePageID"
  >
`
const jobsHtml = `
  ${layoutScript}
  <input
    type="hidden"
    id="pageModuleID"
    value="66"
  />
`
const homeHtml = `
  ${layoutScript}
  <input
    type="hidden"
    id="pageModuleID"
  />
  <input
    type="hidden"
    id="pagePageID"
    value="1"
  />
`
const quickLinksHtml = `
  ${layoutScript}
  <input
    type="hidden"
    id="pageModuleID"
    value="29"
  />
`
const otherHtml = `
  <input
    type="hidden"
    id="pageModuleID"
    value="1"
  >
`
const civicplusHeaders = new Headers({ 'set-cookie': 'CP_IsMobile=false; path=/' })

describe('isCivicplusHtml', () => {
  it('should return true for the layout scripts', () => {
    expect(isCivicplusHtml(newsFlashHtml)).toBe(true)
  })

  it('should return false for other markup', () => {
    expect(isCivicplusHtml(otherHtml)).toBe(false)
  })

  it('should return false for the script path quoted in text', () => {
    const value = '<code>/Areas/Layout/Assets/Scripts/Search.js</code>'

    expect(isCivicplusHtml(value)).toBe(false)
  })
})

describe('isCivicplusHeaders', () => {
  it('should return true for the mobile cookie', () => {
    expect(isCivicplusHeaders(civicplusHeaders)).toBe(true)
  })

  it('should return false for other cookies', () => {
    const value = new Headers({ 'set-cookie': 'ASP.NET_SessionId=abc; path=/' })

    expect(isCivicplusHeaders(value)).toBe(false)
  })
})

describe('civicplusHandler', () => {
  describe('match', () => {
    it('should match a module page', () => {
      expect(civicplusHandler.match('https://example.com/CivicAlerts.aspx', newsFlashHtml)).toBe(
        true,
      )
    })

    it('should match a module page by the cookie', () => {
      expect(
        civicplusHandler.match('https://example.com/CivicAlerts.aspx', otherHtml, civicplusHeaders),
      ).toBe(true)
    })

    it('should match the home page', () => {
      expect(civicplusHandler.match('https://example.com/', homeHtml)).toBe(true)
    })

    it('should match a module without a feed', () => {
      expect(civicplusHandler.match('https://example.com/QuickLinks.aspx', quickLinksHtml)).toBe(
        true,
      )
    })

    it('should not match other software', () => {
      expect(civicplusHandler.match('https://example.com/CivicAlerts.aspx', otherHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the news flash feed', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/RSSFeed.aspx?ModID=1&CID=All-newsflash.xml',
          hint: { key: 'civicplus:news-flash', label: 'News Flash' },
        },
      ]

      expect(civicplusHandler.resolve('https://example.com/m/newsflash', newsFlashHtml)).toEqual(
        expected,
      )
    })

    it('should return the jobs feed', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/RSSFeed.aspx?ModID=66&CID=All-0&CommunityJobs=False',
          hint: { key: 'civicplus:jobs', label: 'Jobs' },
        },
      ]

      expect(civicplusHandler.resolve('https://example.com/Jobs.aspx', jobsHtml)).toEqual(expected)
    })

    it('should return the pages feed for the home page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/RSSFeed.aspx?ModID=76&CID=All-0',
          hint: { key: 'civicplus:pages', label: 'Pages' },
        },
      ]

      expect(civicplusHandler.resolve('https://example.com/', homeHtml)).toEqual(expected)
    })

    it('should return the pages feed for a module without a feed', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/RSSFeed.aspx?ModID=76&CID=All-0',
          hint: { key: 'civicplus:pages', label: 'Pages' },
        },
      ]

      expect(
        civicplusHandler.resolve('https://example.com/QuickLinks.aspx', quickLinksHtml),
      ).toEqual(expected)
    })
  })
})

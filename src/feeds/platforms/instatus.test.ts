import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { instatusHandler, isInstatusHeaders, isInstatusHtml } from './instatus.js'

const instatusHtml = `
  <div class="custom-html-above-header"></div>
  <div class="custom-html-below-footer"></div>
`
const footerOnlyHtml = `
  <div class="custom-html-below-footer"></div>
`
const otherHtml = `
  <a href="https://instatus.com">Powered by Instatus</a>
`
const instatusHeaders = new Headers({ 'x-matched-path': '/[lang]/[url]/[type]/[userId]' })
const incidentHeaders = new Headers({ 'x-matched-path': '/[lang]/[url]/[type]/[userId]/[id]' })
const otherHeaders = new Headers({ 'x-matched-path': '/[slug]' })

describe('isInstatusHtml', () => {
  it('should return true for the custom HTML slots of the page template', () => {
    expect(isInstatusHtml(instatusHtml)).toBe(true)
  })

  it('should return false for one slot alone', () => {
    expect(isInstatusHtml(footerOnlyHtml)).toBe(false)
  })

  it('should return false for a page that only mentions the platform', () => {
    expect(isInstatusHtml(otherHtml)).toBe(false)
  })
})

describe('isInstatusHeaders', () => {
  it('should return true for the status page route', () => {
    expect(isInstatusHeaders(instatusHeaders)).toBe(true)
  })

  it('should return true for a route nested under the status page', () => {
    expect(isInstatusHeaders(incidentHeaders)).toBe(true)
  })

  it('should return false for another route', () => {
    expect(isInstatusHeaders(otherHeaders)).toBe(false)
  })

  it('should return false without the header', () => {
    expect(isInstatusHeaders(new Headers())).toBe(false)
  })
})

describe('instatusHandler', () => {
  describe('match', () => {
    it('should match a status page by its content', () => {
      expect(instatusHandler.match('https://status.example.com/', instatusHtml)).toBe(true)
    })

    it('should match a status page by its headers', () => {
      const value = instatusHandler.match('https://status.example.com/', '', instatusHeaders)

      expect(value).toBe(true)
    })

    it('should not match another status page', () => {
      const value = instatusHandler.match('https://status.example.com/', otherHtml, otherHeaders)

      expect(value).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the incident history feeds', () => {
      const value = 'https://status.example.com/default/cmsg8106700fq1aoau4cl0ddt'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://status.example.com/history.rss',
          hint: { key: 'instatus:history', label: 'Incident history', format: 'rss' },
        },
        {
          uri: 'https://status.example.com/history.atom',
          hint: { key: 'instatus:history', label: 'Incident history', format: 'atom' },
        },
      ]

      expect(instatusHandler.resolve(value)).toEqual(expected)
    })

    it('should return the translated incident history feeds', () => {
      const value = 'https://status.example.com/zh-tw/history/1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://status.example.com/zh-tw/history.rss',
          hint: { key: 'instatus:history', label: 'Incident history', format: 'rss' },
        },
        {
          uri: 'https://status.example.com/zh-tw/history.atom',
          hint: { key: 'instatus:history', label: 'Incident history', format: 'atom' },
        },
      ]

      expect(instatusHandler.resolve(value)).toEqual(expected)
    })
  })
})

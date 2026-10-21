import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isOpenstatusPage, openstatusHandler } from './openstatus.js'

const openstatusHtml = `
  <link
    rel="alternate"
    type="application/json"
    href="https://status.example.com/api/status/summary.json"
  />
`
const previewImageHtml = `
  <meta
    property="og:image"
    content="https://www.openstatus.dev/api/og/page?slug=example"
  >
`
const mentionHtml = `
  <a
    href="https://www.openstatus.dev"
    rel="noopener"
  >Powered by OpenStatus</a>
`
const otherHtml = `
  <a
    href="https://example.com"
    rel="noopener"
  >Powered by something else</a>
`

describe('isOpenstatusPage', () => {
  const url = 'https://status.example.com/'

  it('should return true for the summary endpoint link', () => {
    expect(isOpenstatusPage(url, openstatusHtml)).toBe(true)
  })

  it('should return true for a relative summary endpoint link', () => {
    const value = '<link rel="alternate" href="/api/status/summary.json">'

    expect(isOpenstatusPage(url, value)).toBe(true)
  })

  it('should return false for the summary endpoint link of another host', () => {
    const value = '<link rel="alternate" href="https://status.example.net/api/status/summary.json">'

    expect(isOpenstatusPage(url, value)).toBe(false)
  })

  it('should return true for the generated preview image', () => {
    expect(isOpenstatusPage(url, previewImageHtml)).toBe(true)
  })

  it('should return false for the summary endpoint in prose', () => {
    const value = '<p>Poll <code>/api/status/summary.json</code> for the current state.</p>'

    expect(isOpenstatusPage(url, value)).toBe(false)
  })

  it('should return false for a page that only mentions the project', () => {
    expect(isOpenstatusPage(url, mentionHtml)).toBe(false)
  })

  it('should return false for another status page', () => {
    expect(isOpenstatusPage(url, otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isOpenstatusPage(url, '')).toBe(false)
  })
})

describe('openstatusHandler', () => {
  describe('match', () => {
    it('should match a status page', () => {
      expect(openstatusHandler.match('https://status.example.com/', openstatusHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(openstatusHandler.match('https://status.example.com/')).toBe(false)
    })

    it('should not match another status page', () => {
      expect(openstatusHandler.match('https://status.example.com/', otherHtml)).toBe(false)
    })

    it('should not match a page linking the summary endpoint of another host', () => {
      const value = 'https://blog.example.com/post'

      expect(openstatusHandler.match(value, openstatusHtml)).toBe(false)
    })

    it('should not match a page that only mentions the project', () => {
      expect(openstatusHandler.match('https://example.org/example/repo', mentionHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the updates feeds', () => {
      const value = 'https://status.example.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://status.example.com/feed/rss',
          hint: { key: 'openstatus:updates', label: 'Updates', format: 'rss' },
        },
        {
          uri: 'https://status.example.com/feed/atom',
          hint: { key: 'openstatus:updates', label: 'Updates', format: 'atom' },
        },
      ]

      expect(openstatusHandler.resolve(value)).toEqual(expected)
    })
  })
})

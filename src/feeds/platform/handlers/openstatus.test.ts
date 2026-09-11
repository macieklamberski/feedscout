import { describe, expect, it } from 'bun:test'
import { isOpenstatusHtml, openstatusHandler } from './openstatus.js'

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

describe('isOpenstatusHtml', () => {
  it('should return true for the summary endpoint link', () => {
    expect(isOpenstatusHtml(openstatusHtml)).toBe(true)
  })

  it('should return true for the generated preview image', () => {
    expect(isOpenstatusHtml(previewImageHtml)).toBe(true)
  })

  it('should return false for a page that only mentions the project', () => {
    expect(isOpenstatusHtml(mentionHtml)).toBe(false)
  })

  it('should return false for another status page', () => {
    expect(isOpenstatusHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isOpenstatusHtml('')).toBe(false)
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

    it('should not match a page that only mentions the project', () => {
      expect(openstatusHandler.match('https://github.com/example/repo', mentionHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(openstatusHandler.match('not-a-url', openstatusHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the updates feeds', () => {
      const value = 'https://status.example.com/'
      const expected = [
        {
          uri: 'https://status.example.com/feed/rss',
          hint: { key: 'openstatus:updates-rss', label: 'Updates (RSS)' },
        },
        {
          uri: 'https://status.example.com/feed/atom',
          hint: { key: 'openstatus:updates-atom', label: 'Updates (Atom)' },
        },
      ]

      expect(openstatusHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(openstatusHandler.resolve('not-a-url')).toEqual([])
    })
  })
})

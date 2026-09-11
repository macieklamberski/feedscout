import { describe, expect, it } from 'bun:test'
import { isWikidotHtml, wikidotHandler } from './wikidot.js'

const wikidotHtml = `
  <link
    rel="alternate"
    type="application/wiki"
    href="javascript:WIKIDOT.page.listeners.editClick()"
  />
`
const otherHtml = `
  <html>
    <head>
      <meta
        name="generator"
        content="MediaWiki"
      >
    </head>
  </html>
`

describe('isWikidotHtml', () => {
  it('should return true for the edit link handler', () => {
    expect(isWikidotHtml(wikidotHtml)).toBe(true)
  })

  it('should return false for other wiki software', () => {
    expect(isWikidotHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isWikidotHtml('')).toBe(false)
  })
})

describe('wikidotHandler', () => {
  describe('match', () => {
    it('should match a Wikidot page on a wikidot.com host', () => {
      expect(wikidotHandler.match('https://example.wikidot.com/page', wikidotHtml)).toBe(true)
    })

    it('should match a Wikidot page on a custom domain', () => {
      expect(wikidotHandler.match('https://example.com/page', wikidotHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(wikidotHandler.match('https://example.wikidot.com/page')).toBe(false)
    })

    it('should not match other wiki software', () => {
      expect(wikidotHandler.match('https://example.com/page', otherHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(wikidotHandler.match('not-a-url', wikidotHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the site and forum feeds', () => {
      const value = 'https://example.com/page'
      const expected = [
        {
          uri: 'https://example.com/feed/site-changes.xml',
          hint: { key: 'wikidot:site-changes', label: 'Site changes' },
        },
        {
          uri: 'https://example.com/feed/forum/threads.xml',
          hint: { key: 'wikidot:forum-threads', label: 'Forum threads' },
        },
      ]

      expect(wikidotHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(wikidotHandler.resolve('not-a-url')).toEqual([])
    })
  })
})

import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { lemmyHandler } from './lemmy.js'

const communityHtml = `
  <html>
    <head>
      <meta
        data-inferno-helmet="true"
        property="og:image"
        content="https://lemmy.example.com/pictrs/image/community.png"
      >
    </head>
    <body class="lemmy-site"></body>
  </html>
`
const communityHtmlWithoutIcon = '<html><body class="lemmy-site"></body></html>'

describe('lemmyHandler', () => {
  describe('match', () => {
    it('should match community path with Lemmy HTML', () => {
      expect(lemmyHandler.match('https://lemmy.example.com/c/technology', communityHtml)).toBe(true)
    })

    it('should match community path with Lemmy powered-by header', () => {
      const value = new Headers({ 'x-powered-by': 'Lemmy' })

      expect(lemmyHandler.match('https://lemmy.example.com/c/technology', '', value)).toBe(true)
    })

    it('should not match community path without Lemmy signals', () => {
      expect(lemmyHandler.match('https://example.com/c/technology', '<html></html>')).toBe(false)
    })

    it('should not match user path', () => {
      expect(lemmyHandler.match('https://lemmy.example.com/u/alice', communityHtml)).toBe(false)
    })

    it('should not match home path', () => {
      expect(lemmyHandler.match('https://lemmy.example.com/', communityHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(lemmyHandler.match('not-a-url', communityHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should resolve community icon from og:image', () => {
        const value = 'https://lemmy.example.com/c/technology'
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://lemmy.example.com/pictrs/image/community.png' },
        ]

        expect(lemmyHandler.resolve(value, communityHtml)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array when community has no icon', () => {
        const value = 'https://lemmy.example.com/c/technology'

        expect(lemmyHandler.resolve(value, communityHtmlWithoutIcon)).toEqual([])
      })

      it('should return empty array when content is absent', () => {
        expect(lemmyHandler.resolve('https://lemmy.example.com/c/technology')).toEqual([])
      })

      it('should return empty array for user path', () => {
        expect(lemmyHandler.resolve('https://lemmy.example.com/u/alice', communityHtml)).toEqual([])
      })

      it('should return empty array for invalid URL', () => {
        expect(lemmyHandler.resolve('not-a-url', communityHtml)).toEqual([])
      })
    })
  })
})

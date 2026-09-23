import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { arenaHandler } from './arena.js'

const profileHtml = `
  <html>
    <head>
      <meta
        property="og:image"
        content="https://static.avatars.are.na/15/large_f91bdac52d14ef988c9818884d6865db.jpg?1616377630"
        data-next-head=""
      />
      <meta
        property="og:image:width"
        content="1200"
        data-next-head=""
      />
    </head>
  </html>
`

const placeholderProfileHtml = `
  <html>
    <head>
      <meta
        property="og:image"
        content="https://www.are.na/og-image.png"
        data-next-head=""
      />
    </head>
  </html>
`

describe('arenaHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(arenaHandler.match('https://www.are.na/charles-broskoski')).toBe(true)
    })

    it('should match URLs without www', () => {
      expect(arenaHandler.match('https://are.na/charles-broskoski')).toBe(true)
    })

    it('should not match the root URL', () => {
      expect(arenaHandler.match('https://www.are.na')).toBe(false)
      expect(arenaHandler.match('https://www.are.na/')).toBe(false)
    })

    it('should not match editorial pages', () => {
      expect(arenaHandler.match('https://www.are.na/editorial')).toBe(false)
      expect(arenaHandler.match('https://www.are.na/editorial/some-article')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(arenaHandler.match('https://www.are.na/explore')).toBe(false)
      expect(arenaHandler.match('https://www.are.na/settings')).toBe(false)
    })

    it('should not match channel URLs', () => {
      expect(arenaHandler.match('https://www.are.na/meg-miller/good-sign-offs')).toBe(false)
    })

    it('should not match non-Are.na URLs', () => {
      expect(arenaHandler.match('https://example.com/charles-broskoski')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(arenaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('profile pages', () => {
      it('should return the og:image avatar', async () => {
        const result = await arenaHandler.resolve(
          'https://www.are.na/charles-broskoski',
          profileHtml,
        )
        const expected: Array<DiscoverUriEntry> = [
          {
            uri: 'https://static.avatars.are.na/15/large_f91bdac52d14ef988c9818884d6865db.jpg?1616377630',
          },
        ]

        expect(result).toEqual(expected)
      })

      it('should return empty array for the placeholder og:image', async () => {
        const result = await arenaHandler.resolve(
          'https://www.are.na/charles-broskoski',
          placeholderProfileHtml,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when og:image is missing', async () => {
        const result = await arenaHandler.resolve(
          'https://www.are.na/charles-broskoski',
          '<html><head></head></html>',
        )

        expect(result).toEqual([])
      })

      it('should return empty array without content', async () => {
        const result = await arenaHandler.resolve('https://www.are.na/charles-broskoski')

        expect(result).toEqual([])
      })
    })

    it('should return empty array for channel pages', async () => {
      const result = await arenaHandler.resolve(
        'https://www.are.na/meg-miller/good-sign-offs',
        profileHtml,
      )

      expect(result).toEqual([])
    })

    it('should return empty array for editorial pages', async () => {
      const result = await arenaHandler.resolve('https://www.are.na/editorial', profileHtml)

      expect(result).toEqual([])
    })
  })
})

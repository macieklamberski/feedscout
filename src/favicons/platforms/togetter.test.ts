import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { togetterHandler } from './togetter.js'

const createProfilePage = (image: string): string => {
  const jsonLd = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url: 'https://togetter.com/id/example',
      mainEntity: {
        '@type': 'Person',
        url: 'https://togetter.com/id/example',
        name: 'Example (@example)',
        image,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [],
    },
  ])

  return `<html><head><script type="application/ld+json">${jsonLd}</script></head></html>`
}

describe('togetterHandler', () => {
  describe('match', () => {
    it('should match user pages', () => {
      expect(togetterHandler.match('https://togetter.com/id/example')).toBe(true)
    })

    it('should match user pages on www host', () => {
      expect(togetterHandler.match('https://www.togetter.com/id/example')).toBe(true)
    })

    it('should not match summary pages', () => {
      expect(togetterHandler.match('https://togetter.com/li/123456')).toBe(false)
    })

    it('should not match the home page', () => {
      expect(togetterHandler.match('https://togetter.com/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(togetterHandler.match('https://example.com/id/example')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(togetterHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the 400x400 avatar from the ProfilePage JSON-LD', () => {
        const value = createProfilePage('https://example.com/profile_images/123/abc_normal.jpg')
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/profile_images/123/abc_400x400.jpg' },
        ]

        expect(togetterHandler.resolve('https://togetter.com/id/example', value)).toEqual(expected)
      })

      it('should return the avatar from a single JSON-LD object', () => {
        const jsonLd = JSON.stringify({
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            image: 'https://example.com/profile_images/123/abc_normal.png',
          },
        })
        const value = `<script type="application/ld+json">${jsonLd}</script>`
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/profile_images/123/abc_400x400.png' },
        ]

        expect(togetterHandler.resolve('https://togetter.com/id/example', value)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array without content', () => {
        expect(togetterHandler.resolve('https://togetter.com/id/example')).toEqual([])
      })

      it('should return empty array without JSON-LD', () => {
        const value = '<html><head><title>Example</title></head></html>'

        expect(togetterHandler.resolve('https://togetter.com/id/example', value)).toEqual([])
      })

      it('should return empty array for invalid JSON-LD', () => {
        const value = '<script type="application/ld+json">{not json</script>'

        expect(togetterHandler.resolve('https://togetter.com/id/example', value)).toEqual([])
      })

      it('should return empty array when mainEntity has no image', () => {
        const jsonLd = JSON.stringify({
          '@type': 'ProfilePage',
          mainEntity: { '@type': 'Person' },
        })
        const value = `<script type="application/ld+json">${jsonLd}</script>`

        expect(togetterHandler.resolve('https://togetter.com/id/example', value)).toEqual([])
      })

      it('should return empty array when no item is a ProfilePage', () => {
        const jsonLd = JSON.stringify({
          '@type': 'Article',
          mainEntity: {
            '@type': 'Person',
            image: 'https://example.com/profile_images/123/abc_normal.jpg',
          },
        })
        const value = `<script type="application/ld+json">${jsonLd}</script>`

        expect(togetterHandler.resolve('https://togetter.com/id/example', value)).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should return the image unchanged when it has no size suffix', () => {
        const value = createProfilePage('https://example.com/profile_images/123/abc.jpg')
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/profile_images/123/abc.jpg' },
        ]

        expect(togetterHandler.resolve('https://togetter.com/id/example', value)).toEqual(expected)
      })

      it('should read the ProfilePage after an invalid JSON-LD block', () => {
        const profilePage = createProfilePage(
          'https://example.com/profile_images/123/abc_normal.jpg',
        )
        const value = `<script type="application/ld+json">{not json</script>${profilePage}`
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/profile_images/123/abc_400x400.jpg' },
        ]

        expect(togetterHandler.resolve('https://togetter.com/id/example', value)).toEqual(expected)
      })
    })
  })
})

import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { behanceHandler } from './behance.js'

const avatarBase = 'https://pps.services.adobe.com/api/profile/ABC123@AdobeID/image/0f1e2d3c'

const personJsonLd = JSON.stringify({
  '@context': 'http://schema.org',
  '@type': 'Person',
  name: 'Alice Designer',
  image: [
    { '@type': 'ImageObject', height: '50px', width: '50px', url: `${avatarBase}/50` },
    { '@type': 'ImageObject', height: '230px', width: '230px', url: `${avatarBase}/230` },
    { '@type': 'ImageObject', height: '138px', width: '138px', url: `${avatarBase}/138` },
    { '@type': 'ImageObject', height: '276px', width: '276px', url: `${avatarBase}/276` },
  ],
  url: 'https://www.behance.net/alice',
})

const createPage = (jsonLd: string): string => {
  return `<html><head><script type="application/ld+json">${jsonLd}</script></head></html>`
}

describe('behanceHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(behanceHandler.match('https://www.behance.net/alice')).toBe(true)
    })

    it('should match profile URLs without www', () => {
      expect(behanceHandler.match('https://behance.net/alice')).toBe(true)
    })

    it('should match profile appreciated pages', () => {
      expect(behanceHandler.match('https://www.behance.net/alice/appreciated')).toBe(true)
    })

    it('should not match gallery pages', () => {
      expect(behanceHandler.match('https://www.behance.net/gallery/123456/Brand-Identity')).toBe(
        false,
      )
    })

    it('should not match excluded paths', () => {
      expect(behanceHandler.match('https://www.behance.net/search')).toBe(false)
      expect(behanceHandler.match('https://www.behance.net/galleries')).toBe(false)
    })

    it('should not match the homepage', () => {
      expect(behanceHandler.match('https://www.behance.net/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(behanceHandler.match('https://example.com/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(behanceHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the largest JSON-LD Person image', async () => {
        const content = createPage(personJsonLd)
        const result = await behanceHandler.resolve('https://www.behance.net/alice', content)
        const expected: Array<DiscoverUriEntry> = [{ uri: `${avatarBase}/276` }]

        expect(result).toEqual(expected)
      })

      it('should skip JSON-LD blocks that are not a Person', async () => {
        const organization = JSON.stringify({
          '@type': 'Organization',
          image: [{ width: '500px', url: 'https://example.com/logo.png' }],
        })
        const content = `${createPage(organization)}${createPage(personJsonLd)}`
        const result = await behanceHandler.resolve('https://www.behance.net/alice', content)
        const expected: Array<DiscoverUriEntry> = [{ uri: `${avatarBase}/276` }]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array when content is missing', async () => {
        const result = await behanceHandler.resolve('https://www.behance.net/alice')

        expect(result).toEqual([])
      })

      it('should return empty array when the page has no JSON-LD', async () => {
        const content = '<html><head><title>Alice</title></head></html>'
        const result = await behanceHandler.resolve('https://www.behance.net/alice', content)

        expect(result).toEqual([])
      })

      it('should return empty array when JSON-LD is invalid', async () => {
        const content = createPage('{"@type":"Person",')
        const result = await behanceHandler.resolve('https://www.behance.net/alice', content)

        expect(result).toEqual([])
      })

      it('should return empty array when the Person has no image', async () => {
        const content = createPage(JSON.stringify({ '@type': 'Person', name: 'Alice' }))
        const result = await behanceHandler.resolve('https://www.behance.net/alice', content)

        expect(result).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should skip images without a url', async () => {
        const jsonLd = JSON.stringify({
          '@type': 'Person',
          image: [{ width: '100px', url: `${avatarBase}/100` }, { width: '276px' }],
        })
        const content = createPage(jsonLd)
        const result = await behanceHandler.resolve('https://www.behance.net/alice', content)
        const expected: Array<DiscoverUriEntry> = [{ uri: `${avatarBase}/100` }]

        expect(result).toEqual(expected)
      })
    })
  })
})

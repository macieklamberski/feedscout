import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type JellypodUrl, jellypodHandler, parseJellypodUrl } from './jellypod.js'

describe('parseJellypodUrl', () => {
  it('should return the show for a show subdomain', () => {
    const expected: JellypodUrl = { kind: 'show' }

    expect(parseJellypodUrl('https://alice-podcast.jellypod.com/')).toEqual(expected)
  })

  it('should return the show for an episode page', () => {
    const value = 'https://alice-podcast.jellypod.com/episodes/0b6f2c1e-4d3a-4f5b-9c8d-7e6f5a4b3c2d'
    const expected: JellypodUrl = { kind: 'show' }

    expect(parseJellypodUrl(value)).toEqual(expected)
  })

  it('should return undefined for an excluded subdomain', () => {
    expect(parseJellypodUrl('https://studio.jellypod.com/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseJellypodUrl('https://jellypod.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseJellypodUrl('https://example.com/')).toBeUndefined()
  })
})

describe('jellypodHandler', () => {
  describe('match', () => {
    it('should return true for a show subdomain', () => {
      expect(jellypodHandler.match('https://alice-podcast.jellypod.com/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(jellypodHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(jellypodHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the podcast feed for a show', () => {
      const value =
        'https://alice-podcast.jellypod.com/episodes/0b6f2c1e-4d3a-4f5b-9c8d-7e6f5a4b3c2d'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice-podcast.jellypod.com/rss',
          hint: { key: 'jellypod:podcast', label: 'Podcast' },
        },
      ]

      expect(jellypodHandler.resolve(value)).toEqual(expected)
    })
  })
})

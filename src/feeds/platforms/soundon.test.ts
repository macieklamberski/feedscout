import { describe, expect, it } from 'bun:test'
import { parseSoundonUrl, type SoundonUrl, soundonHandler } from './soundon.js'

describe('parseSoundonUrl', () => {
  it('should return the podcast for a podcast page', () => {
    const expected: SoundonUrl = {
      kind: 'podcast',
      podcastId: '2b3a8f6c-1234-4abc-9def-0123456789ab',
    }

    expect(
      parseSoundonUrl('https://player.soundon.fm/p/2b3a8f6c-1234-4abc-9def-0123456789ab'),
    ).toEqual(expected)
  })

  it('should return the podcast for an embed page', () => {
    const expected: SoundonUrl = {
      kind: 'podcast',
      podcastId: '2b3a8f6c-1234-4abc-9def-0123456789ab',
    }

    expect(
      parseSoundonUrl(
        'https://player.soundon.fm/embed/?podcast=2b3a8f6c-1234-4abc-9def-0123456789ab',
      ),
    ).toEqual(expected)
  })

  it('should return undefined for an id that is not a UUID', () => {
    expect(parseSoundonUrl('https://player.soundon.fm/p/abc')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(
      parseSoundonUrl('https://example.com/p/2b3a8f6c-1234-4abc-9def-0123456789ab'),
    ).toBeUndefined()
  })
})

describe('soundonHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://player.soundon.fm/p/0f4d2c1e-8a3b-4c5d-9e6f-7a8b9c0d1e2f'],
      [
        true,
        'https://player.soundon.fm/p/0f4d2c1e-8a3b-4c5d-9e6f-7a8b9c0d1e2f/episodes/1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
      ],
      [true, 'https://player.soundon.fm/P/0F4D2C1E-8A3B-4C5D-9E6F-7A8B9C0D1E2F'],
      [true, 'https://player.soundon.fm/embed?podcast=0f4d2c1e-8a3b-4c5d-9e6f-7a8b9c0d1e2f'],
      [
        true,
        'https://player.soundon.fm/embed/?podcast=0f4d2c1e-8a3b-4c5d-9e6f-7a8b9c0d1e2f&episode=1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
      ],
      [false, 'https://player.soundon.fm/embed?episode=1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'],
      [false, 'https://player.soundon.fm/embed?podcast=0f4d2c1e'],
      [false, 'https://player.soundon.fm/p/0f4d2c1e-8a3b'],
      [false, 'https://player.soundon.fm/p/0f4d2c1e-8a3b-4c5d-9e6f-7a8b9c0d1e2fx'],
      [false, 'https://player.soundon.fm/episode/1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'],
      [false, 'https://player.soundon.fm/'],
      [false, 'https://www.soundon.fm/p/0f4d2c1e-8a3b-4c5d-9e6f-7a8b9c0d1e2f'],
      [false, 'https://example.com/p/0f4d2c1e-8a3b-4c5d-9e6f-7a8b9c0d1e2f'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(soundonHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside SoundOn', () => {
      expect(soundonHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for podcast page', () => {
      const value = 'https://player.soundon.fm/p/0f4d2c1e-8a3b-4c5d-9e6f-7a8b9c0d1e2f'
      const expected = [
        {
          uri: 'https://feeds.soundon.fm/podcasts/0f4d2c1e-8a3b-4c5d-9e6f-7a8b9c0d1e2f.xml',
          hint: { key: 'soundon:podcast', label: 'Podcast' },
        },
      ]

      expect(soundonHandler.resolve(value)).toEqual(expected)
    })

    it('should return podcast feed URL for episode page', () => {
      const value =
        'https://player.soundon.fm/p/0f4d2c1e-8a3b-4c5d-9e6f-7a8b9c0d1e2f/episodes/1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
      const expected = [
        {
          uri: 'https://feeds.soundon.fm/podcasts/0f4d2c1e-8a3b-4c5d-9e6f-7a8b9c0d1e2f.xml',
          hint: { key: 'soundon:podcast', label: 'Podcast' },
        },
      ]

      expect(soundonHandler.resolve(value)).toEqual(expected)
    })

    it('should return podcast feed URL for embed player', () => {
      const value =
        'https://player.soundon.fm/embed/?podcast=0f4d2c1e-8a3b-4c5d-9e6f-7a8b9c0d1e2f&episode=1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
      const expected = [
        {
          uri: 'https://feeds.soundon.fm/podcasts/0f4d2c1e-8a3b-4c5d-9e6f-7a8b9c0d1e2f.xml',
          hint: { key: 'soundon:podcast', label: 'Podcast' },
        },
      ]

      expect(soundonHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the case of an uppercase podcast ID', () => {
      const value = 'https://player.soundon.fm/p/0F4D2C1E-8A3B-4C5D-9E6F-7A8B9C0D1E2F'
      const expected = [
        {
          uri: 'https://feeds.soundon.fm/podcasts/0F4D2C1E-8A3B-4C5D-9E6F-7A8B9C0D1E2F.xml',
          hint: { key: 'soundon:podcast', label: 'Podcast' },
        },
      ]

      expect(soundonHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for URL without podcast ID', () => {
      const value = 'https://player.soundon.fm/'

      expect(soundonHandler.resolve(value)).toEqual([])
    })
  })
})

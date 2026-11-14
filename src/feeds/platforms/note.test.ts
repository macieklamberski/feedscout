import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { NoteUrl } from './note.js'
import { noteHandler, parseNoteUrl } from './note.js'

describe('parseNoteUrl', () => {
  it('should return the user for a profile page', () => {
    const expected: NoteUrl = { kind: 'user', username: 'tsukasa_yamato' }

    expect(parseNoteUrl('https://note.com/tsukasa_yamato')).toEqual(expected)
  })

  it('should return the note for an article page', () => {
    const expected: NoteUrl = { kind: 'note', username: 'tsukasa_yamato' }

    expect(parseNoteUrl('https://note.com/tsukasa_yamato/n/some-note')).toEqual(expected)
  })

  it('should return the user for the www host', () => {
    const expected: NoteUrl = { kind: 'user', username: 'alice' }

    expect(parseNoteUrl('https://www.note.com/alice')).toEqual(expected)
  })

  it('should return the magazine for a magazine page', () => {
    const expected: NoteUrl = { kind: 'magazine', username: 'notemag', magazine: 'm7244518f06ae' }

    expect(parseNoteUrl('https://note.com/notemag/m/m7244518f06ae')).toEqual(expected)
  })

  it('should return the magazine for a magazine page with a capitalized m segment', () => {
    const expected: NoteUrl = { kind: 'magazine', username: 'notemag', magazine: 'm7244518f06ae' }

    expect(parseNoteUrl('https://note.com/notemag/M/m7244518f06ae')).toEqual(expected)
  })

  it('should return the tag for a hashtag page', () => {
    const expected: NoteUrl = { kind: 'hashtag', tag: 'AI' }

    expect(parseNoteUrl('https://note.com/hashtag/AI')).toEqual(expected)
  })

  it('should return the tag for a hashtag page with a capitalized hashtag segment', () => {
    const expected: NoteUrl = { kind: 'hashtag', tag: 'AI' }

    expect(parseNoteUrl('https://note.com/Hashtag/AI')).toEqual(expected)
  })

  it('should return the tag for the tag page a hashtag redirects to', () => {
    const expected: NoteUrl = { kind: 'hashtag', tag: 'AI' }

    expect(parseNoteUrl('https://note.com/tag/AI')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: NoteUrl = { kind: 'home' }

    expect(parseNoteUrl('https://note.com/')).toEqual(expected)
  })

  it('should return undefined for a dotted first segment', () => {
    expect(parseNoteUrl('https://note.com/robots.txt')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseNoteUrl('https://example.com/alice')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseNoteUrl('not-a-url')).toBeUndefined()
  })
})

describe('noteHandler', () => {
  describe('match', () => {
    it('should match a note.com URL', () => {
      expect(noteHandler.match('https://note.com')).toBe(true)
    })

    it('should not match another host', () => {
      expect(noteHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://note.com/tsukasa_yamato'
      const expected = [
        {
          uri: 'https://note.com/tsukasa_yamato/rss',
          hint: { key: 'note:blog', label: 'Blog' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })

    it('should return the author blog feed for a note', () => {
      const value = 'https://note.com/tsukasa_yamato/n/n1234567890ab'
      const expected = [
        {
          uri: 'https://note.com/tsukasa_yamato/rss',
          hint: { key: 'note:blog', label: 'Blog' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for hashtag page', () => {
      const value = 'https://note.com/hashtag/AI'
      const expected = [
        {
          uri: 'https://note.com/hashtag/AI/rss',
          hint: { key: 'note:hashtag', label: 'Hashtag' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for magazine page', () => {
      const value = 'https://note.com/notemag/m/m7244518f06ae'
      const expected = [
        {
          uri: 'https://note.com/notemag/m/m7244518f06ae/rss',
          hint: { key: 'note:magazine', label: 'Magazine' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })

    it('should return featured feed for root path', () => {
      const value = 'https://note.com/'
      const expected = [
        {
          uri: 'https://note.com/rss',
          hint: { key: 'note:featured', label: 'Featured' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the blog hint for a blog feed', () => {
      const value = 'https://note.com/tsukasa_yamato/rss'
      const expected: DiscoverUriHint = { key: 'note:blog', label: 'Blog' }

      expect(noteHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for a blog feed whose name ends in an encoded space', () => {
      const value = 'https://note.com/alice%20/rss'
      const expected: DiscoverUriHint = { key: 'note:blog', label: 'Blog' }

      expect(noteHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the hashtag hint for a hashtag feed', () => {
      const value = 'https://note.com/hashtag/%E6%9D%BE%E5%B1%8B/rss'
      const expected: DiscoverUriHint = { key: 'note:hashtag', label: 'Hashtag' }

      expect(noteHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the magazine hint for a magazine feed', () => {
      const value = 'https://note.com/notemag/m/m7244518f06ae/rss'
      const expected: DiscoverUriHint = { key: 'note:magazine', label: 'Magazine' }

      expect(noteHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the featured hint for the featured feed', () => {
      const value = 'https://note.com/rss'
      const expected: DiscoverUriHint = { key: 'note:featured', label: 'Featured' }

      expect(noteHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://note.com/tsukasa_yamato'

      expect(noteHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a hashtag page', () => {
      const value = 'https://note.com/hashtag/AI'

      expect(noteHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path under a dotted first segment', () => {
      const value = 'https://note.com/robots.txt/rss'

      expect(noteHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/tsukasa_yamato/rss'

      expect(noteHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://note.com/alice%20/rss', { key: 'note:blog', label: 'Blog' }],
      ['https://note.com/hashtag/AI/rss', { key: 'note:hashtag', label: 'Hashtag' }],
      ['https://note.com/notemag/m/m7244518f06ae/rss', { key: 'note:magazine', label: 'Magazine' }],
      ['https://note.com/rss', { key: 'note:featured', label: 'Featured' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [noteHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})

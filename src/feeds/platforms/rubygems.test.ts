import { describe, expect, it } from 'bun:test'
import { rubygemsHandler } from './rubygems.js'

describe('rubygemsHandler', () => {
  describe('match', () => {
    it('should match a gem page', () => {
      expect(rubygemsHandler.match('https://rubygems.org/gems/example')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(rubygemsHandler.match('https://example.com/gems/example')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the versions feed for a gem page', () => {
      const value = 'https://rubygems.org/gems/example-gem'
      const expected = [
        {
          uri: 'https://rubygems.org/gems/example-gem/versions.atom',
          hint: { key: 'rubygems:versions', label: 'Versions' },
        },
      ]

      expect(rubygemsHandler.resolve(value)).toEqual(expected)
    })

    it('should return the versions feed for a gem version page', () => {
      const value = 'https://rubygems.org/gems/example_gem/versions/1.0.0'
      const expected = [
        {
          uri: 'https://rubygems.org/gems/example_gem/versions.atom',
          hint: { key: 'rubygems:versions', label: 'Versions' },
        },
      ]

      expect(rubygemsHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the case of the gem name', () => {
      const value = 'https://rubygems.org/Gems/ExampleGem'
      const expected = [
        {
          uri: 'https://rubygems.org/gems/ExampleGem/versions.atom',
          hint: { key: 'rubygems:versions', label: 'Versions' },
        },
      ]

      expect(rubygemsHandler.resolve(value)).toEqual(expected)
    })

    it('should return the latest gems feed for the home page', () => {
      const value = 'https://rubygems.org/'
      const expected = [
        {
          uri: 'https://rubygems.org/gems.atom',
          hint: { key: 'rubygems:latest-gems', label: 'Latest gems' },
        },
      ]

      expect(rubygemsHandler.resolve(value)).toEqual(expected)
    })
  })
})

import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type DspacePage, dspaceHandler, getDspacePage, isDspaceHtml } from './dspace.js'

const escapedStateHtml = `
  <ds-app
    _nghost-sc26=""
    ng-version="15.2.10"
  ></ds-app>
  <script id="dspace-angular-state" type="application/json">{&q;APP_CONFIG_STATE&q;:{&q;rest&q;:{&q;ssl&q;:true,&q;host&q;:&q;api.example.org&q;,&q;port&q;:443,&q;nameSpace&q;:&q;/server&q;,&q;baseUrl&q;:&q;https://api.example.org/server&q;}}}</script>
`
const plainStateHtml = `
  <ds-app
    ng-version="17.3.12"
    ng-server-context="ssr"
  ></ds-app>
  <script id="dspace-angular-state" type="application/json">{"APP_CONFIG_STATE":{"rest":{"ssl":true,"host":"api.example.org","port":443,"nameSpace":"/server","baseUrl":"https://api.example.org/server"}}}</script>
`
const statelessHtml = '<ds-app></ds-app>'
const xmluiHtml = `
  <head>
    <meta
      name="Generator"
      content="DSpace 6.2"
    >
    <link
      type="application/rss+xml"
      rel="alternate"
      href="/xmlui/feed/rss_2.0/site"
    >
  </head>
`

describe('isDspaceHtml', () => {
  it('should return true for the app root element', () => {
    expect(isDspaceHtml(statelessHtml)).toBe(true)
  })

  it('should return false for a DSpace 6 page', () => {
    expect(isDspaceHtml(xmluiHtml)).toBe(false)
  })

  it('should return false for the element name in text', () => {
    expect(isDspaceHtml('<p>&lt;ds-app&gt;</p>')).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isDspaceHtml('')).toBe(false)
  })
})

describe('getDspacePage', () => {
  it('should return the collection named in the URL', () => {
    const value = 'https://example.com/collections/376236b0-16ee-4ede-a680-dfa9c0b88e70'
    const expected: DspacePage = {
      kind: 'collection',
      restUrl: 'https://example.com/server',
      uuid: '376236b0-16ee-4ede-a680-dfa9c0b88e70',
    }

    expect(getDspacePage(value, statelessHtml)).toEqual(expected)
  })

  it('should return the community named in the URL', () => {
    const value = 'https://example.com/communities/0785bafa-41ec-44b7-b228-246c5981f4e0'
    const expected: DspacePage = {
      kind: 'community',
      restUrl: 'https://example.com/server',
      uuid: '0785bafa-41ec-44b7-b228-246c5981f4e0',
    }

    expect(getDspacePage(value, statelessHtml)).toEqual(expected)
  })

  it('should return the collection of a UI under a sub-path', () => {
    const value = 'https://example.com/repository/collections/376236b0-16ee-4ede-a680-dfa9c0b88e70'
    const expected: DspacePage = {
      kind: 'collection',
      restUrl: 'https://example.com/server',
      uuid: '376236b0-16ee-4ede-a680-dfa9c0b88e70',
    }

    expect(getDspacePage(value, statelessHtml)).toEqual(expected)
  })

  it('should return the home page for an item page', () => {
    const value = 'https://example.com/items/6d99b708-56f6-4009-a700-b0f6aa2d671b'
    const expected: DspacePage = { kind: 'home', restUrl: 'https://example.com/server' }

    expect(getDspacePage(value, statelessHtml)).toEqual(expected)
  })

  it('should return the home page for a collection route without an id', () => {
    const value = 'https://example.com/collections/create'
    const expected: DspacePage = { kind: 'home', restUrl: 'https://example.com/server' }

    expect(getDspacePage(value, statelessHtml)).toEqual(expected)
  })

  it('should return the home page for a not-found page', () => {
    const value = 'https://example.com/collections/00000000-1111-2222-3333-444444444444'
    const content = '<ds-app><ds-pagenotfound></ds-pagenotfound></ds-app>'
    const expected: DspacePage = { kind: 'home', restUrl: 'https://example.com/server' }

    expect(getDspacePage(value, content)).toEqual(expected)
  })

  it('should return the home page for a uuid followed by more characters', () => {
    const value = 'https://example.com/collections/376236b0-16ee-4ede-a680-dfa9c0b88e70abc'
    const expected: DspacePage = { kind: 'home', restUrl: 'https://example.com/server' }

    expect(getDspacePage(value, statelessHtml)).toEqual(expected)
  })

  it('should return the collection for an uppercase route word', () => {
    const value = 'https://example.com/Collections/376236b0-16ee-4ede-a680-dfa9c0b88e70'
    const expected: DspacePage = {
      kind: 'collection',
      restUrl: 'https://example.com/server',
      uuid: '376236b0-16ee-4ede-a680-dfa9c0b88e70',
    }

    expect(getDspacePage(value, statelessHtml)).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const value = 'https://example.com/'
    const expected: DspacePage = { kind: 'home', restUrl: 'https://example.com/server' }

    expect(getDspacePage(value, statelessHtml)).toEqual(expected)
  })

  it('should read the REST URL from an escaped transfer state', () => {
    const value = 'https://example.com/'
    const expected: DspacePage = { kind: 'home', restUrl: 'https://api.example.org/server' }

    expect(getDspacePage(value, escapedStateHtml)).toEqual(expected)
  })

  it('should read the REST URL from a JSON transfer state', () => {
    const value = 'https://example.com/'
    const expected: DspacePage = { kind: 'home', restUrl: 'https://api.example.org/server' }

    expect(getDspacePage(value, plainStateHtml)).toEqual(expected)
  })

  it('should drop a trailing slash from the REST URL', () => {
    const value = 'https://example.com/'
    const content =
      '<script id="dspace-angular-state">{"APP_CONFIG_STATE":{"rest":{"baseUrl":"https://example.com/server/"}}}</script>'
    const expected: DspacePage = { kind: 'home', restUrl: 'https://example.com/server' }

    expect(getDspacePage(value, content)).toEqual(expected)
  })

  it('should fall back to the default REST path for a REST URL that is not http', () => {
    const value = 'https://example.com/'
    const content =
      '<script id="dspace-angular-state">{"APP_CONFIG_STATE":{"rest":{"baseUrl":"javascript:alert(1)"}}}</script>'
    const expected: DspacePage = { kind: 'home', restUrl: 'https://example.com/server' }

    expect(getDspacePage(value, content)).toEqual(expected)
  })

  it('should fall back to the default REST path for a malformed transfer state', () => {
    const value = 'https://example.com/'
    const content = '<script id="dspace-angular-state">{"APP_CONFIG_STATE":</script>'
    const expected: DspacePage = { kind: 'home', restUrl: 'https://example.com/server' }

    expect(getDspacePage(value, content)).toEqual(expected)
  })

  it('should fall back to the default REST path without content', () => {
    const value = 'https://example.com/'
    const expected: DspacePage = { kind: 'home', restUrl: 'https://example.com/server' }

    expect(getDspacePage(value, undefined)).toEqual(expected)
  })

  it('should return the collection named in the URL without content', () => {
    const value = 'https://example.com/collections/376236b0-16ee-4ede-a680-dfa9c0b88e70'
    const expected: DspacePage = {
      kind: 'collection',
      restUrl: 'https://example.com/server',
      uuid: '376236b0-16ee-4ede-a680-dfa9c0b88e70',
    }

    expect(getDspacePage(value, undefined)).toEqual(expected)
  })

  it('should return undefined for an unparsable URL', () => {
    expect(getDspacePage('not-a-url', statelessHtml)).toBeUndefined()
  })
})

describe('dspaceHandler', () => {
  describe('match', () => {
    it('should match a DSpace page', () => {
      expect(dspaceHandler.match('https://example.com/', statelessHtml)).toBe(true)
    })

    it('should not match a DSpace 6 page', () => {
      expect(dspaceHandler.match('https://example.com/xmlui/', xmluiHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(dspaceHandler.resolve('not-a-url', statelessHtml)).toEqual([])
    })

    it('should return the collection and site feeds for a collection', () => {
      const value = 'https://example.com/collections/376236b0-16ee-4ede-a680-dfa9c0b88e70'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://api.example.org/server/opensearch/search?format=atom&scope=376236b0-16ee-4ede-a680-dfa9c0b88e70&query=*',
          hint: { key: 'dspace:collection', label: 'Collection', format: 'atom' },
        },
        {
          uri: 'https://api.example.org/server/opensearch/search?format=rss&scope=376236b0-16ee-4ede-a680-dfa9c0b88e70&query=*',
          hint: { key: 'dspace:collection', label: 'Collection', format: 'rss' },
        },
        {
          uri: 'https://api.example.org/server/opensearch/search?format=atom&query=*',
          hint: { key: 'dspace:site', label: 'Site', format: 'atom' },
        },
        {
          uri: 'https://api.example.org/server/opensearch/search?format=rss&query=*',
          hint: { key: 'dspace:site', label: 'Site', format: 'rss' },
        },
      ]

      expect(dspaceHandler.resolve(value, plainStateHtml)).toEqual(expected)
    })

    it('should return the community and site feeds for a community', () => {
      const value = 'https://example.com/communities/0785bafa-41ec-44b7-b228-246c5981f4e0'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://api.example.org/server/opensearch/search?format=atom&scope=0785bafa-41ec-44b7-b228-246c5981f4e0&query=*',
          hint: { key: 'dspace:community', label: 'Community', format: 'atom' },
        },
        {
          uri: 'https://api.example.org/server/opensearch/search?format=rss&scope=0785bafa-41ec-44b7-b228-246c5981f4e0&query=*',
          hint: { key: 'dspace:community', label: 'Community', format: 'rss' },
        },
        {
          uri: 'https://api.example.org/server/opensearch/search?format=atom&query=*',
          hint: { key: 'dspace:site', label: 'Site', format: 'atom' },
        },
        {
          uri: 'https://api.example.org/server/opensearch/search?format=rss&query=*',
          hint: { key: 'dspace:site', label: 'Site', format: 'rss' },
        },
      ]

      expect(dspaceHandler.resolve(value, plainStateHtml)).toEqual(expected)
    })

    it('should return the site feeds for the home page', () => {
      const value = 'https://example.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://api.example.org/server/opensearch/search?format=atom&query=*',
          hint: { key: 'dspace:site', label: 'Site', format: 'atom' },
        },
        {
          uri: 'https://api.example.org/server/opensearch/search?format=rss&query=*',
          hint: { key: 'dspace:site', label: 'Site', format: 'rss' },
        },
      ]

      expect(dspaceHandler.resolve(value, plainStateHtml)).toEqual(expected)
    })
  })
})

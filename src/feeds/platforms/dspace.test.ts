import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  type DspacePage,
  dspaceHandler,
  getDspacePage,
  isDspaceHtml,
  isLegacyDspaceHeaders,
  isLegacyDspaceHtml,
} from './dspace.js'

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
const jspuiCommunityHtml = `
  <link
    rel="stylesheet"
    href="/jspui/static/css/bootstrap/dspace-theme.css"
    type="text/css"
  />
  <link
    rel="alternate"
    type="application/rdf+xml"
    title="Items in Community"
    href="/jspui/feed/rss_1.0/123456789/1"
  />
  <link
    rel="alternate"
    type="application/rss+xml"
    title="Items in Community"
    href="/jspui/feed/atom_1.0/123456789/1"
  />
  <link
    rel="alternate"
    type="application/rss+xml"
    title="Items in Community"
    href="/jspui/feed/rss_2.0/123456789/1"
  />
`
const jspuiCollectionHtml = `
  <link
    rel="stylesheet"
    href="/static/css/bootstrap/dspace-theme.css"
    type="text/css"
  />
  <link
    rel="alternate"
    type="application/rss+xml"
    title="Items in Collection"
    href="/feed/rss_2.0/123456789/42"
  />
`
const jspuiHomeHtml = `
  <link
    rel="stylesheet"
    href="/static/css/bootstrap/dspace-theme.css"
    type="text/css"
  />
  <link
    rel="alternate"
    type="application/rss+xml"
    title="Items in Example Repository"
    href="/feed/rss_2.0/site"
  />
`
const jspuiItemHtml = `
  <link
    rel="stylesheet"
    href="/static/css/bootstrap/dspace-theme.css"
    type="text/css"
  />
`
const xmluiCommunityHtml = `
  <link
    type="application/atom+xml"
    rel="alternate"
    href="/feed/atom_1.0/10183/1"
  >
  <link
    type="application/rss+xml"
    rel="alternate"
    href="/feed/rss_2.0/10183/1"
  >
  <div
    id="aspect_artifactbrowser_CommunityViewer_div_community-home"
    class="ds-static-div primary repository community"
  ></div>
`
const xmluiCollectionHtml = `
  <link
    type="application/atom+xml"
    rel="alternate"
    href="/feed/atom_1.0/10183/42"
  >
  <div
    id="aspect_artifactbrowser_CollectionViewer_div_collection-home"
    class="ds-static-div primary repository collection"
  ></div>
`
const xmluiUnknownHtml = `
  <link
    type="application/atom+xml"
    rel="alternate"
    href="/feed/atom_1.0/10183/42"
  >
`
const jspuiLegacyCollectionHtml = `
  <meta
    name="Generator"
    content="DSpace 1.6.2"
  />
  <link
    rel="alternate"
    type="application/rdf+xml"
    title="Items in Collection"
    href="/rdpc/feed/rss_1.0/123456789/100"
  />
  <link
    rel="alternate"
    type="application/rss+xml"
    title="Items in Collection"
    href="/rdpc/feed/rss_2.0/123456789/100"
  />
  <link
    rel="alternate"
    type="application/rss+xml"
    title="Items in Collection"
    href="/rdpc/feed/atom_1.0/123456789/100"
  />
`
const cocoonHeaders = new Headers({ 'x-cocoon-version': '2.2.0' })

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

describe('isLegacyDspaceHtml', () => {
  it('should return true for the JSPUI stylesheet', () => {
    expect(isLegacyDspaceHtml(jspuiItemHtml)).toBe(true)
  })

  it('should return true for the DSpace generator', () => {
    expect(isLegacyDspaceHtml(jspuiLegacyCollectionHtml)).toBe(true)
  })

  it('should return false for a generator of another name', () => {
    expect(isLegacyDspaceHtml('<meta name="generator" content="DSpaceX 1.0">')).toBe(false)
  })

  it('should return false for a generator that names DSpace after another word', () => {
    expect(isLegacyDspaceHtml('<meta name="generator" content="Foo DSpace 1.0">')).toBe(false)
  })

  it('should return false for a stylesheet of another name', () => {
    const value = '<link rel="stylesheet" href="/static/css/bootstrap/dspace-theme.css.map">'

    expect(isLegacyDspaceHtml(value)).toBe(false)
  })

  it('should return false for an XMLUI page', () => {
    expect(isLegacyDspaceHtml(xmluiCommunityHtml)).toBe(false)
  })
})

describe('isLegacyDspaceHeaders', () => {
  it('should return true for the Cocoon header', () => {
    expect(isLegacyDspaceHeaders(cocoonHeaders)).toBe(true)
  })

  it('should return false without the Cocoon header', () => {
    expect(isLegacyDspaceHeaders(new Headers({ server: 'nginx' }))).toBe(false)
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

  it('should return the community feeds of a JSPUI page under a sub-path', () => {
    const value = 'https://example.com/jspui/handle/123456789/1'
    const expected: DspacePage = {
      kind: 'legacyCommunity',
      feeds: [
        { uri: 'https://example.com/jspui/feed/rss_1.0/123456789/1', format: 'rdf' },
        { uri: 'https://example.com/jspui/feed/atom_1.0/123456789/1', format: 'atom' },
        { uri: 'https://example.com/jspui/feed/rss_2.0/123456789/1', format: 'rss' },
      ],
    }

    expect(getDspacePage(value, jspuiCommunityHtml)).toEqual(expected)
  })

  it('should return the collection feed of a JSPUI page', () => {
    const value = 'https://example.com/handle/123456789/42'
    const expected: DspacePage = {
      kind: 'legacyCollection',
      feeds: [{ uri: 'https://example.com/feed/rss_2.0/123456789/42', format: 'rss' }],
    }

    expect(getDspacePage(value, jspuiCollectionHtml)).toEqual(expected)
  })

  it('should return the site feed of a DSpace 6 home page', () => {
    const value = 'https://example.com/'
    const expected: DspacePage = {
      kind: 'legacyHome',
      feeds: [{ uri: 'https://example.com/feed/rss_2.0/site', format: 'rss' }],
    }

    expect(getDspacePage(value, jspuiHomeHtml)).toEqual(expected)
  })

  it('should return the community feeds of an XMLUI page', () => {
    const value = 'https://example.com/handle/10183/1'
    const expected: DspacePage = {
      kind: 'legacyCommunity',
      feeds: [
        { uri: 'https://example.com/feed/atom_1.0/10183/1', format: 'atom' },
        { uri: 'https://example.com/feed/rss_2.0/10183/1', format: 'rss' },
      ],
    }

    expect(getDspacePage(value, xmluiCommunityHtml)).toEqual(expected)
  })

  it('should return the collection feed of an XMLUI page', () => {
    const value = 'https://example.com/handle/10183/42'
    const expected: DspacePage = {
      kind: 'legacyCollection',
      feeds: [{ uri: 'https://example.com/feed/atom_1.0/10183/42', format: 'atom' }],
    }

    expect(getDspacePage(value, xmluiCollectionHtml)).toEqual(expected)
  })

  it('should keep the case of a feed link with an uppercase route word', () => {
    const value = 'https://example.com/'
    const content = '<link rel="alternate" href="/Feed/RSS_2.0/Site">'
    const expected: DspacePage = {
      kind: 'legacyHome',
      feeds: [{ uri: 'https://example.com/Feed/RSS_2.0/Site', format: 'rss' }],
    }

    expect(getDspacePage(value, content)).toEqual(expected)
  })

  it('should return the collection feeds of a DSpace 1.6 JSPUI page', () => {
    const value = 'https://example.com/rdpc/handle/123456789/100'
    const expected: DspacePage = {
      kind: 'legacyCollection',
      feeds: [
        { uri: 'https://example.com/rdpc/feed/rss_1.0/123456789/100', format: 'rdf' },
        { uri: 'https://example.com/rdpc/feed/rss_2.0/123456789/100', format: 'rss' },
        { uri: 'https://example.com/rdpc/feed/atom_1.0/123456789/100', format: 'atom' },
      ],
    }

    expect(getDspacePage(value, jspuiLegacyCollectionHtml)).toEqual(expected)
  })

  it('should ignore a DSpace 6 feed link on a DSpace 7 page', () => {
    const value = 'https://example.com/'
    const content = '<ds-app></ds-app><link rel="alternate" href="/feed/rss_2.0/site">'
    const expected: DspacePage = { kind: 'home', restUrl: 'https://example.com/server' }

    expect(getDspacePage(value, content)).toEqual(expected)
  })

  it('should return undefined for a scoped feed on a page that names no kind', () => {
    const value = 'https://example.com/handle/10183/42'

    expect(getDspacePage(value, xmluiUnknownHtml)).toBeUndefined()
  })
})

describe('dspaceHandler', () => {
  describe('match', () => {
    it('should match a DSpace page', () => {
      expect(dspaceHandler.match('https://example.com/', statelessHtml)).toBe(true)
    })

    it('should match a DSpace 6 page by its generator and feed link', () => {
      expect(dspaceHandler.match('https://example.com/xmlui/', xmluiHtml)).toBe(true)
    })

    it('should match a DSpace 1.6 JSPUI page', () => {
      const value = 'https://example.com/rdpc/handle/123456789/100'

      expect(dspaceHandler.match(value, jspuiLegacyCollectionHtml)).toBe(true)
    })

    it('should not match a page with the DSpace generator and no feed link', () => {
      const value = 'https://example.com/'
      const content = '<meta name="generator" content="DSpace 1.6.2">'

      expect(dspaceHandler.match(value, content)).toBe(false)
    })

    it('should match a JSPUI page that links a feed', () => {
      expect(dspaceHandler.match('https://example.com/', jspuiHomeHtml)).toBe(true)
    })

    it('should match an XMLUI page that links a feed', () => {
      const value = 'https://example.com/handle/10183/1'

      expect(dspaceHandler.match(value, xmluiCommunityHtml, cocoonHeaders)).toBe(true)
    })

    it('should not match a JSPUI page that links no feed', () => {
      expect(dspaceHandler.match('https://example.com/', jspuiItemHtml)).toBe(false)
    })

    it('should not match a Cocoon page without content', () => {
      expect(dspaceHandler.match('https://example.com/', undefined, cocoonHeaders)).toBe(false)
    })

    it('should not match a Cocoon page with a feed link of another shape', () => {
      const value = 'https://example.com/'
      const content = `
        <link
          rel="alternate"
          href="/feed/rss_2.0/site/extra"
        >
        <link
          rel="alternate"
          href="/feed/json/site"
        >
        <link rel="alternate">
      `

      expect(dspaceHandler.match(value, content, cocoonHeaders)).toBe(false)
    })

    it('should not match a Cocoon page with a feed link that is not an alternate', () => {
      const value = 'https://example.com/'
      const content = '<link rel="stylesheet" href="/feed/rss_2.0/site">'

      expect(dspaceHandler.match(value, content, cocoonHeaders)).toBe(false)
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

    it('should return the linked feeds for a DSpace 6 page', () => {
      const value = 'https://example.com/handle/123456789/42'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/feed/rss_2.0/123456789/42',
          hint: { key: 'dspace:collection', label: 'Collection', format: 'rss' },
        },
      ]

      expect(dspaceHandler.resolve(value, jspuiCollectionHtml)).toEqual(expected)
    })

    it('should return the linked feeds for a DSpace 6 community page', () => {
      const value = 'https://example.com/handle/10183/1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/feed/atom_1.0/10183/1',
          hint: { key: 'dspace:community', label: 'Community', format: 'atom' },
        },
        {
          uri: 'https://example.com/feed/rss_2.0/10183/1',
          hint: { key: 'dspace:community', label: 'Community', format: 'rss' },
        },
      ]

      expect(dspaceHandler.resolve(value, xmluiCommunityHtml)).toEqual(expected)
    })

    it('should return the linked feeds for a DSpace 6 home page', () => {
      const value = 'https://example.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/feed/rss_2.0/site',
          hint: { key: 'dspace:site', label: 'Site', format: 'rss' },
        },
      ]

      expect(dspaceHandler.resolve(value, jspuiHomeHtml)).toEqual(expected)
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

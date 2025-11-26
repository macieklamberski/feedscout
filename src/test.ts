import { discoverFeeds } from './exports/index.js'

const feeds = await discoverFeeds(
  { url: 'http://inessential.com/' },
  { methods: ['guess'] },
  // { methods: ['headers', 'html'] }
)

console.log(feeds)

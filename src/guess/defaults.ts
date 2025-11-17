export const feedMimeTypes = [
  // RSS
  'application/rss+xml',
  'text/rss+xml',
  'application/x-rss+xml',
  'application/rss',
  // Atom
  'application/atom+xml',
  'text/atom+xml',
  // JSON Feed
  'application/feed+json',
  'application/json',
  // RDF
  'application/rdf+xml',
  'text/rdf+xml',
  'application/atom',
  // Generic
  'application/xml',
  'text/xml',
]

// Covers modern static generators and simple WordPress setups.
export const feedUrisMinimal = ['/feed', '/rss', '/atom.xml', '/feed.xml', '/rss.xml', '/index.xml']

// Includes JSON Feed and common variations.
export const feedUrisBalanced = [
  ...feedUrisMinimal,
  '/feed/',
  '/index.atom',
  '/index.rss',
  '/feed.json',
]

// Includes WordPress query parameters and Blogger patterns.
export const feedUrisComprehensive = [
  ...feedUrisBalanced,
  '/?feed=rss',
  '/?feed=rss2',
  '/?feed=atom',
  '/feeds/posts/default',
]

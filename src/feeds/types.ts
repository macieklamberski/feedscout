export type FeedResultValid = {
  format: 'rss' | 'atom' | 'json' | 'rdf'
  title?: string
  description?: string
  siteUrl?: string
  method?: 'html' | 'headers' | 'guess'
}

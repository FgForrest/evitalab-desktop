import { EvitaDBBlogPost } from '../model/EvitaDBBlogPost'
import ky, { KyInstance } from 'ky'
import { List } from 'immutable'

/**
 * Manager for data used on welcome screen
 */
export class WelcomeScreenService {
    protected readonly httpClient: KyInstance

    constructor() {
        this.httpClient = ky.create({
            timeout: 300000 // 5 minutes
        })
    }

    /**
     * Returns the latest evitaDB blog posts to display on news page.
     */
    getBlogPosts = async (): Promise<List<EvitaDBBlogPost>> => {
        try {
            const rssResponse: string = await this.httpClient.get('https://evitadb.io/rss.xml').text()
            const rss: Document = new window.DOMParser().parseFromString(rssResponse, 'text/xml')

            const items: NodeListOf<Element> | undefined = rss.querySelector('channel')?.querySelectorAll('item')
            if (items == undefined) {
                console.log('No evitaDB blog posts found in RSS feed.')
                return List()
            }

            const blogPosts: EvitaDBBlogPost[] = []
            items.forEach((item: Element) => {
                blogPosts.push({
                    title: item.querySelector('title')?.textContent ?? '',
                    perex: item.querySelector('description')?.textContent ?? '',
                    url: item.querySelector('link')?.textContent ?? '',
                    thumbnailUrl: item.querySelector('enclosure')?.getAttribute('url') ?? ''
                })
            })
            // we need only 2 latest blog posts
            blogPosts.reverse().splice(2)
            return List(blogPosts)
        } catch (e: any) {
            throw new Error(`Could not fetch blog posts: ${e.message}`)
        }
    }
}

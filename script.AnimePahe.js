/** searchResults
 * Searches for anime/shows/movies based on a keyword.
 * @param {string} keyword - The search keyword.
 * @returns {Promise<string>} - A JSON string of search results.
 */
async function searchResults(keyword) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const responseText = await soraFetch(`https://animepahe.si/api?m=search&q=${encodedKeyword}&l=8`);
        const data = JSON.parse(responseText);

        const transformedResults = data.data.map(anime => ({
            title: anime.title,
            image: anime.poster,
            href: `https://animepahe.si/watch/${anime.id}`
        }));

        return JSON.stringify(transformedResults);
    } catch (error) {
        console.log('Fetch error:', error);
        return JSON.stringify([{ title: 'Error', image: '', href: '' }]);
    }
}

/** extractDetails
 * Extracts details of an anime from its page URL.
 * @param {string} url - The URL of the anime page.
 * @returns {Promise<string>} - A JSON string of the anime details.
 */
async function extractDetails(url) {
    try {
        const match = url.match(/https:\/\/animepahe\.si\/watch\/(.+)$/);
        const encodedID = match[1];
        const response = await soraFetch(`https://animepahe.si/api?m=release&id=${encodedID}`);
        const data = JSON.parse(response).data[0];

        const transformedResults = [{
            description: data.description || 'No description available',
            aliases: `Type: ${data.type || 'Unknown'}`,
            airdate: `Released: ${data.year || 'Unknown'}`
        }];

        return JSON.stringify(transformedResults);
    } catch (error) {
        console.log('Details error:', error);
        return JSON.stringify([{
            description: 'Error loading description',
            aliases: 'Type: Unknown',
            airdate: 'Released: Unknown'
        }]);
    }
}

/** extractEpisodes
 * Extracts episodes of an anime from its page URL.
 * @param {string} url - The URL of the anime page.
 * @returns {Promise<string>} - A JSON string of the anime episodes.
 */
async function extractEpisodes(url) {
    try {
        const match = url.match(/https:\/\/animepahe\.si\/watch\/(.+)$/);
        const encodedID = match[1];
        const response = await soraFetch(`https://animepahe.si/api?m=release&id=${encodedID}`);
        const data = JSON.parse(response).data[0].episodes;

        const transformedResults = data.map(ep => ({
            href: `https://animepahe.si/watch/${encodedID}?ep=${ep.id}`,
            number: ep.episode
        }));

        return JSON.stringify(transformedResults);
    } catch (error) {
        console.log('Fetch error:', error);
        return "[]";
    }
}

/** extractStreamUrl
 * Extracts the stream URL of an anime episode from its page URL.
 * @param {string} url - The URL of the anime episode page.
 * @returns {Promise<string|null>} - The stream URL or null if not found.
 */
async function extractStreamUrl(url) {
    try {
        const match = url.match(/\?ep=(.+)$/);
        const epId = match[1];
        const response = await soraFetch(`https://animepahe.si/api?m=link&id=${epId}`);
        const data = JSON.parse(response).data[0];

        const hlsSource = data.sources.find(source => source.type === 'hls');
        return hlsSource ? hlsSource.url : null;
    } catch (error) {
        console.log('Fetch error:', error);
        return null;
    }
}

/** soraFetch
 * Fetch function that tries to use a custom fetch implementation first,
 * and falls back to the native fetch if it fails.
 * @param {string} url - The URL to fetch.
 * @param {Object} options - The options for the fetch request.
 * @returns {Promise<Response|null>} - The response object or null if an error occurs.
 */
async function soraFetch(url, options = { headers: {}, method: 'GET', body: null }) {
    try {
        return await fetchv2(url, options.headers ?? {}, options.method ?? 'GET', options.body ?? null);
    } catch(e) {
        try {
            return await fetch(url, options).then(res => res.text());
        } catch(error) {
            console.log('soraFetch error: ' + error.message);
            return null;
        }
    }
}

/** searchResults
 * Search AnimeKai
 */
async function searchResults(keyword) {
    try {
        const encoded = encodeURIComponent(keyword);
        const res = await soraFetch(`https://animekai.to/api/search?keyword=${encoded}`);
        const data = JSON.parse(res);

        const results = data.data.map(a => ({
            title: a.name,
            image: a.poster,
            href: `https://animekai.to/watch/${a.id}`
        }));

        return JSON.stringify(results);
    } catch (e) {
        return JSON.stringify([{ title: "Error", image: "", href: "" }]);
    }
}

/** extractDetails */
async function extractDetails(url) {
    try {
        const id = url.split("/watch/")[1];
        const res = await soraFetch(`https://animekai.to/api/anime/${id}`);
        const data = JSON.parse(res).data;

        return JSON.stringify([
            {
                description: data.info.description || "No description",
                aliases: `Duration: ${data.info.stats?.duration || "Unknown"}`,
                airdate: `Aired: ${data.moreInfo?.aired || "Unknown"}`
            }
        ]);
    } catch (e) {
        return JSON.stringify([{ description: "Error", aliases: "", airdate: "" }]);
    }
}

/** extractEpisodes */
async function extractEpisodes(url) {
    try {
        const id = url.split("/watch/")[1];
        const res = await soraFetch(`https://animekai.to/api/anime/${id}/episodes`);
        const data = JSON.parse(res).data.episodes;

        return JSON.stringify(
            data.map(ep => ({
                href: `https://animekai.to/watch/${id}?ep=${ep.episodeId}`,
                number: ep.number
            }))
        );
    } catch (e) {
        return "[]";
    }
}

/** extractStreamUrl */
async function extractStreamUrl(url) {
    try {
        const id = url.split("?ep=")[1];
        const api = `https://animekai.to/api/episode/sources?animeEpisodeId=${id}&category=dub`;

        const res = await soraFetch(api);
        const data = JSON.parse(res).data.sources;

        const hls = data.find(src => src.type === "hls");
        return hls ? hls.url : null;
    } catch (e) {
        return null;
    }
}

/** soraFetch */
async function soraFetch(url, options = { headers: {}, method: "GET", body: null }) {
    try {
        return await fetchv2(url, options.headers ?? {}, options.method ?? "GET", options.body ?? null);
    } catch (e) {
        try {
            return await fetch(url, options).then(res => res.text());
        } catch (err) {
            console.log("Fetch failed:", err);
            return null;
        }
    }
}

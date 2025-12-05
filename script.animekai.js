/** searchResults */
async function searchResults(keyword) {
    try {
        const encoded = encodeURIComponent(keyword);
        const res = await soraFetch(`https://api.animekai.to/search?keyword=${encoded}`);
        const data = JSON.parse(res);

        if (!data?.data) throw new Error("No data");

        const results = data.data
            .filter(a => a.dub_available) // prioritize English dub
            .map(a => ({
                title: a.title || a.name,
                image: a.poster || a.cover,
                href: `https://animekai.to/watch/${a.id}`
            }));

        return JSON.stringify(results);
    } catch (e) {
        console.log("Search error:", e.message);
        return JSON.stringify([{ title: "Error", image: "", href: "" }]);
    }
}

/** extractDetails */
async function extractDetails(url) {
    try {
        const id = url.split("/watch/")[1].split("?")[0];
        const res = await soraFetch(`https://api.animekai.to/anime/${id}`);
        const data = JSON.parse(res).data;

        return JSON.stringify([
            {
                description: data.description || "No description available",
                aliases: `Duration: ${data.stats?.duration || "Unknown"}`,
                airdate: `Aired: ${data.moreInfo?.aired || "Unknown"}`
            }
        ]);
    } catch (e) {
        console.log("Details error:", e.message);
        return JSON.stringify([{ description: "Error", aliases: "", airdate: "" }]);
    }
}

/** extractEpisodes */
async function extractEpisodes(url) {
    try {
        const id = url.split("/watch/")[1].split("?")[0];
        const res = await soraFetch(`https://api.animekai.to/anime/${id}/episodes`);
        const episodes = JSON.parse(res).data || [];

        return JSON.stringify(
            episodes.map(ep => ({
                href: `https://animekai.to/watch/${id}?ep=${ep.id}`,
                number: ep.number || ep.episode
            }))
        );
    } catch (e) {
        console.log("Episodes error:", e.message);
        return "[]";
    }
}

/** extractStreamUrl */
async function extractStreamUrl(url) {
    try {
        const epId = url.split("?ep=")[1];
        const res = await soraFetch(`https://api.animekai.to/episode/${epId}/sources`);
        const sources = JSON.parse(res).data?.sources || [];

        const hls = sources.find(src => src.type === "hls");
        return hls ? hls.url : null;
    } catch (e) {
        console.log("Stream error:", e.message);
        return null;
    }
}

/** soraFetch */
async function soraFetch(url, options = { headers: {}, method: "GET", body: null }) {
    try {
        if (typeof fetchv2 === "function") {
            return await fetchv2(url, options.headers ?? {}, options.method ?? "GET", options.body ?? null);
        }
        return await fetch(url, options).then(res => res.text());
    } catch (err) {
        console.log("soraFetch failed:", err.message);
        return null;
    }
}

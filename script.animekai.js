/** soraFetch helper */
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

/** searchResults: scrape AnimeKai HTML search page */
async function searchResults(keyword) {
    try {
        const url = `https://animekai.to/browser?keyword=${encodeURIComponent(keyword)}`;
        const html = await soraFetch(url);
        if (!html) throw new Error("No HTML fetched");

        // Match each <a class="aitem" ...> block
        const regex = /<a class="aitem" href="(\/watch\/[^"]+)">[\s\S]*?<h6 class="title"[^>]*>([^<]+)<\/h6>[\s\S]*?<img src="([^"]+)"/g;
        let match;
        const results = [];

        while ((match = regex.exec(html)) !== null) {
            results.push({
                title: match[2].trim(),
                image: match[3].trim(),
                href: `https://animekai.to${match[1].trim()}`
            });
        }

        if (results.length === 0) {
            results.push({ title: "No results found", image: "", href: "" });
        }

        return JSON.stringify(results);

    } catch (e) {
        console.log("Search error:", e.message);
        return JSON.stringify([{ title: "Error", image: "", href: "" }]);
    }
}

/** extractDetails: basic info from anime page */
async function extractDetails(url) {
    try {
        const html = await soraFetch(url);
        if (!html) throw new Error("No HTML fetched");

        // Description: look for <div class="summary"> or similar
        const descMatch = html.match(/<div class="summary">([\s\S]*?)<\/div>/);
        const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "No description";

        return JSON.stringify([{
            description,
            aliases: "Duration: Unknown",
            airdate: "Aired: Unknown"
        }]);

    } catch (e) {
        console.log("Details error:", e.message);
        return JSON.stringify([{ description: "Error", aliases: "", airdate: "" }]);
    }
}

/** extractEpisodes: scrape episode list from HTML */
async function extractEpisodes(url) {
    try {
        const html = await soraFetch(url);
        if (!html) throw new Error("No HTML fetched");

        // Match <a href="/watch/...?...ep=123">
        const regex = /<a[^>]+href="(\/watch\/[^"?]+(?:\?ep=[^"]+)?)"[^>]*>(?:Episode\s*)?(\d+)/g;
        let match;
        const episodes = [];

        while ((match = regex.exec(html)) !== null) {
            episodes.push({
                href: `https://animekai.to${match[1].trim()}`,
                number: match[2].trim()
            });
        }

        return JSON.stringify(episodes);

    } catch (e) {
        console.log("Episodes error:", e.message);
        return "[]";
    }
}

/** extractStreamUrl: get HLS source from episode page */
async function extractStreamUrl(url) {
    try {
        const html = await soraFetch(url);
        if (!html) throw new Error("No HTML fetched");

        // Match HLS URL in page JS: look for .m3u8 or similar
        const match = html.match(/(https?:\/\/[^\s'"]+\.m3u8)/);
        return match ? match[1].trim() : null;

    } catch (e) {
        console.log("Stream error:", e.message);
        return null;
    }
}

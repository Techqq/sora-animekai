async function searchResults(keyword) {
    try {
        const encoded = encodeURIComponent(keyword);
        const res = await soraFetch(`https://animepahe.si/api?m=search&q=${encoded}&l=8`);
        if (!res) throw new Error("No response");

        const text = typeof res === "string" ? res : JSON.stringify(res);
        const json = JSON.parse(text);

        if (!json?.data) return JSON.stringify([]);

        const results = json.data.map(anime => ({
            title: anime.title,
            image: anime.poster,
            href: `https://animepahe.si/watch/${anime.id}`
        }));

        return JSON.stringify(results);

    } catch (e) {
        console.log("Search error:", e.message);
        return JSON.stringify([{ title: "Error", image: "", href: "" }]);
    }
}

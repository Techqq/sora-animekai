async function searchResults(keyword) {
    try {
        const encoded = encodeURIComponent(keyword);
        const url = `https://animepahe.si/api?m=search&q=${encoded}`;
        const resText = await soraFetch(url);
        if (!resText) throw new Error("No response");

        const res = JSON.parse(resText);

        if (!res.data || !Array.isArray(res.data)) {
            throw new Error("Unexpected API response format");
        }

        const results = res.data.map(a => ({
            title: a.title,
            image: a.poster.replace(/\\/g, ""), // remove backslashes
            href: `https://animepahe.si/watch/${a.id}`
        }));

        return JSON.stringify(results);

    } catch (e) {
        console.log("Search error:", e.message);
        return JSON.stringify([{ title: "Error", image: "", href: "" }]);
    }
}

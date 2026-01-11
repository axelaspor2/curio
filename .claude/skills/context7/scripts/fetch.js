#!/usr/bin/env node

// Context7 ライブラリ検索 → ドキュメント取得を一括実行
// 使用例: node fetch.js "next.js" "routing"

const libraryName = process.argv[2];
const topic = process.argv[3] || "";
const tokens = process.argv[4] || "5000";

if (!libraryName) {
    console.error('Usage: node fetch.js "library name" ["topic"] ["tokens"]');
    console.error('Example: node fetch.js "next.js" "routing"');
    process.exit(1);
}

const apiKey = process.env.CONTEXT7_API_KEY;

const headers = {
    "Content-Type": "application/json",
};

if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
}

async function searchLibrary(query) {
    const url = `https://context7.com/api/v1/search?query=${encodeURIComponent(query)}`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(`検索エラー: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error(
            `"${query}" に一致するライブラリが見つかりませんでした`,
        );
    }

    return data.results[0].id;
}

async function getDocs(libraryId, topic, tokens) {
    let url = `https://context7.com/api/v1${libraryId}?tokens=${tokens}`;

    if (topic) {
        url += `&topic=${encodeURIComponent(topic)}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(`ドキュメント取得エラー: HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";

    // Content-Typeに応じてパース方法を切り替え
    if (contentType.includes("application/json")) {
        const data = await response.json();
        return { content: data.content || data.documentation || "" };
    }
    // マークダウンまたはテキスト形式の場合
    const text = await response.text();
    return { content: text };
}

async function main() {
    try {
        console.error(`ライブラリ検索中: "${libraryName}"...`);

        const libraryId = await searchLibrary(libraryName);
        console.error(`ライブラリID: ${libraryId}`);
        console.error(
            `ドキュメント取得中...${topic ? ` (トピック: ${topic})` : ""}\n`,
        );

        const data = await getDocs(libraryId, topic, tokens);

        const content = data.content || data.documentation || "";

        if (!content) {
            console.log("ドキュメントが見つかりませんでした。");
            return;
        }

        console.log(`=== ${libraryId} ドキュメント ===`);
        if (topic) {
            console.log(`トピック: ${topic}`);
        }
        console.log(`トークン数: ${tokens}\n`);
        console.log(content);
    } catch (error) {
        console.error("エラー:", error.message);
        process.exit(1);
    }
}

main();

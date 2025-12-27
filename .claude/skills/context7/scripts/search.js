#!/usr/bin/env node

// Context7 ライブラリ検索
// 使用例: node search.js "next.js"

const query = process.argv[2];

if (!query) {
    console.error('Usage: node search.js "library name"');
    process.exit(1);
}

const apiKey = process.env.CONTEXT7_API_KEY;

async function searchLibrary(query) {
    const url = `https://context7.com/api/v1/search?query=${encodeURIComponent(query)}`;

    const headers = {
        "Content-Type": "application/json",
    };

    if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
    }

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            console.log(
                `"${query}" に一致するライブラリが見つかりませんでした。`,
            );
            return;
        }

        console.log(`=== "${query}" の検索結果 ===\n`);

        data.results.slice(0, 10).forEach((lib, i) => {
            console.log(`${i + 1}. ${lib.title || lib.name}`);
            console.log(`   ID: ${lib.id}`);
            if (lib.description) {
                console.log(`   説明: ${lib.description.slice(0, 100)}...`);
            }
            console.log("");
        });
    } catch (error) {
        console.error("検索エラー:", error.message);
        process.exit(1);
    }
}

searchLibrary(query);

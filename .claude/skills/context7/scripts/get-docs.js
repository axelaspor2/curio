#!/usr/bin/env node

// Context7 ドキュメント取得
// 使用例: node get-docs.js "/vercel/next.js" "routing" "5000"

const libraryId = process.argv[2];
const topic = process.argv[3] || "";
const tokens = process.argv[4] || "5000";

if (!libraryId) {
    console.error('Usage: node get-docs.js "libraryId" ["topic"] ["tokens"]');
    console.error(
        'Example: node get-docs.js "/vercel/next.js" "routing" "5000"',
    );
    process.exit(1);
}

const apiKey = process.env.CONTEXT7_API_KEY;

async function getDocs(libraryId, topic, tokens) {
    // libraryIdが/で始まっていない場合は追加
    const normalizedId = libraryId.startsWith("/")
        ? libraryId
        : `/${libraryId}`;

    let url = `https://context7.com/api/v1${normalizedId}?tokens=${tokens}`;

    if (topic) {
        url += `&topic=${encodeURIComponent(topic)}`;
    }

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

        const contentType = response.headers.get("content-type") || "";
        let content;

        // Content-Typeに応じてパース方法を切り替え
        if (contentType.includes("application/json")) {
            const data = await response.json();
            content = data.content || data.documentation || "";
        } else {
            // マークダウンまたはテキスト形式の場合
            content = await response.text();
        }

        if (!content || content.trim() === "") {
            console.log("ドキュメントが見つかりませんでした。");
            return;
        }

        console.log(`=== ${normalizedId} ドキュメント ===`);
        if (topic) {
            console.log(`トピック: ${topic}`);
        }
        console.log(`トークン数: ${tokens}\n`);
        console.log(content);
    } catch (error) {
        console.error("取得エラー:", error.message);
        process.exit(1);
    }
}

getDocs(libraryId, topic, tokens);

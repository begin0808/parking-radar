import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// 取得 __dirname 在 ESM 模式下的替代方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_FILE = path.join(__dirname, '../src/data/static_parkings.json');

// 模擬從 API 獲取的資料 (未來可替換為真實 API)
// 例如：交通部 TDX API 或各縣市 Open Data
async function fetchFromSource() {
    console.log("開始抓取全台停車場資料...");

    // 這裡示範產生一些隨機變化的資料，模擬資料更新
    // 實作時請替換為真實的 fetch() 呼叫
    const mockData = [
        {
            "id": "static-001",
            "name": "基隆東岸停車場",
            "lat": 25.1295,
            "lng": 121.7442,
            "total": 300,
            "address": "基隆市仁愛區仁二路236號",
            "city": "基隆市"
        },
        {
            "id": "static-002",
            "name": "台北101停車場",
            "lat": 25.0339,
            "lng": 121.5644,
            "total": 1000,
            "address": "台北市信義區信義路五段7號",
            "city": "台北市"
        },
        {
            "id": "static-auto-" + Date.now(), // 模擬新增的停車場
            "name": `自動更新停車場-${new Date().toISOString().split('T')[0]}`,
            "lat": 24.1500 + Math.random() * 0.01,
            "lng": 120.6500 + Math.random() * 0.01,
            "total": Math.floor(Math.random() * 100),
            "address": "自動更新路段",
            "city": "台中市"
        }
    ];

    return mockData;
}

async function main() {
    try {
        const data = await fetchFromSource();

        // 確保目標目錄存在
        const dir = path.dirname(TARGET_FILE);
        await fs.mkdir(dir, { recursive: true });

        // 寫入檔案
        await fs.writeFile(TARGET_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`成功更新資料！共 ${data.length} 筆。`);
        console.log(`檔案已儲存至: ${TARGET_FILE}`);

    } catch (error) {
        console.error("更新失敗:", error);
        process.exit(1);
    }
}

main();

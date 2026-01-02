/**
 * 小企鵝停車雷達 - 後端代理服務
 * 功能：處理 TDX 認證 (支援多組金鑰輪替)、快取 Token、抓取停車場靜態與動態資料並整合
 */

// 定義支援即時剩餘車位的縣市 (依據 TDX 支援列表)
const LIVE_CITIES = [
  'Taipei', 'NewTaipei', 'Taoyuan', 'Taichung', 'Tainan', 'Kaohsiung', 
  'Keelung', 'Hsinchu', 'HsinchuCounty', 'YilanCounty'
];

function doGet(e) {
  const params = e.parameter;
  const lat = params.lat;
  const lng = params.lng;
  const radius = params.radius || 3000; 
  
  try {
    const token = getTDXToken();
    if (!token) throw new Error("無法取得 TDX Token (所有金鑰皆已嘗試失敗)");

    // 1. 取得範圍內的停車場 (靜態資料)
    const staticUrl = `https://tdx.transportdata.tw/api/basic/v1/Parking/OffStreet/CarPark/General?$format=JSON&$spatialFilter=nearby(Position, ${lat}, ${lng}, ${radius})`;
    
    const staticData = fetchData(staticUrl, token);
    
    // 2. 取得動態剩餘車位
    let dynamicMap = {};
    const city = params.city;
    
    if (city && LIVE_CITIES.includes(city)) {
      const dynamicUrl = `https://tdx.transportdata.tw/api/basic/v1/Parking/OffStreet/ParkingAvailability/City/${city}?$format=JSON`;
      const dynamicData = fetchData(dynamicUrl, token);
      
      dynamicData.forEach(p => {
        dynamicMap[p.CarParkID] = p.AvailableSpaces;
      });
    }

    // 3. 整合資料
    const result = staticData.map(park => {
      const available = dynamicMap[park.CarParkID] !== undefined ? dynamicMap[park.CarParkID] : -1;
      let fareDesc = "依現場公告";
      if (park.FareDescription) fareDesc = park.FareDescription;

      return {
        id: park.CarParkID,
        name: park.CarParkName.Zh_tw,
        lat: park.CarParkPosition.PositionLat,
        lng: park.CarParkPosition.PositionLon,
        total: park.TotalSpaces,
        available: available,
        fare: fareDesc,
        city: park.City,
        address: park.Address
      };
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: result
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 呼叫 TDX API 的通用函式
function fetchData(url, token) {
  const options = {
    method: 'GET',
    headers: {
      'authorization': `Bearer ${token}`,
      'content-type': 'application/json'
    },
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    return JSON.parse(response.getContentText());
  } else {
    Logger.log("Fetch Error: " + response.getContentText());
    return [];
  }
}

/**
 * 取得並快取 TDX Token (支援多組金鑰輪替)
 * 邏輯：依序嘗試 Key 1 -> Key 2 -> Key 3
 */
function getTDXToken() {
  const cache = CacheService.getScriptCache();
  const cachedToken = cache.get("tdx_token");
  
  if (cachedToken) {
    return cachedToken;
  }
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const MAX_KEYS = 3; // 設定最大金鑰組數

  for (let i = 1; i <= MAX_KEYS; i++) {
    const clientId = scriptProperties.getProperty(`CLIENT_ID_${i}`);
    const clientSecret = scriptProperties.getProperty(`CLIENT_SECRET_${i}`);
    
    // 如果這組金鑰沒設定，跳過
    if (!clientId || !clientSecret) {
      Logger.log(`Key Set ${i} not configured, skipping.`);
      continue;
    }

    Logger.log(`Attempting to authenticate with Key Set ${i}...`);
    const token = attemptAuth(clientId, clientSecret);
    
    if (token) {
      Logger.log(`Auth successful with Key Set ${i}.`);
      // 快取 Token (保留 80000 秒，約 22 小時)
      cache.put("tdx_token", token, 80000); 
      return token;
    } else {
      Logger.log(`Auth failed with Key Set ${i}, trying next...`);
    }
  }

  // 全部失敗
  Logger.log("All key sets failed.");
  return null;
}

// 單次認證嘗試
function attemptAuth(clientId, clientSecret) {
  const url = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token';
  const payload = {
    'grant_type': 'client_credentials',
    'client_id': clientId,
    'client_secret': clientSecret
  };
  
  const options = {
    method: 'POST',
    payload: payload,
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() === 200 && data.access_token) {
      return data.access_token;
    }
  } catch (e) {
    Logger.log("Auth Exception: " + e.toString());
  }
  return null;
}

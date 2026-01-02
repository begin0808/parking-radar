/**
 * 小企鵝停車雷達 - 輕量化後端 (v2.0)
 * 功能：僅回傳指定縣市的即時車位狀態 (ID -> Available Map)
 */

function doGet(e) {
  const params = e.parameter;
  const city = params.city;
  
  // 若無指定城市，回傳空資料
  if (!city) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "No city specified"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    const token = getTDXToken();
    if (!token) throw new Error("無法取得 TDX Token");

    // 直接抓取該縣市的所有動態資料
    const dynamicUrl = `https://tdx.transportdata.tw/api/basic/v1/Parking/OffStreet/ParkingAvailability/City/${city}?$format=JSON`;
    const dynamicData = fetchData(dynamicUrl, token);
    
    // 轉換為精簡 Map: { "CarParkID": AvailableSpaces, ... }
    const statusMap = {};
    dynamicData.forEach(p => {
      statusMap[p.CarParkID] = p.AvailableSpaces;
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: statusMap
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ---------------------------------------------------------
// 以下為共用工具函式 (與原版相同)
// ---------------------------------------------------------

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
    Logger.log("Fetch Error (" + response.getResponseCode() + "): " + response.getContentText());
    return [];
  }
}

function getTDXToken() {
  const cache = CacheService.getScriptCache();
  const cachedToken = cache.get("tdx_token");
  if (cachedToken) return cachedToken;
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const MAX_KEYS = 3; 

  for (let i = 1; i <= MAX_KEYS; i++) {
    const clientId = scriptProperties.getProperty(`CLIENT_ID_${i}`);
    const clientSecret = scriptProperties.getProperty(`CLIENT_SECRET_${i}`);
    if (!clientId || !clientSecret) continue;

    const token = attemptAuth(clientId, clientSecret);
    if (token) {
      cache.put("tdx_token", token, 80000); 
      return token;
    }
  }
  return null;
}

function attemptAuth(clientId, clientSecret) {
  const url = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token';
  const payload = {
    'grant_type': 'client_credentials',
    'client_id': clientId,
    'client_secret': clientSecret
  };
  const options = {
    method: 'POST', payload: payload, muteHttpExceptions: true
  };
  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    if (response.getResponseCode() === 200 && data.access_token) return data.access_token;
  } catch (e) {
    Logger.log("Auth Exception: " + e.toString());
  }
  return null;
}

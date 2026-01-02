import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './index.css';

// ==========================================
// 設定區域
// ==========================================
// 請填入您的 GAS 網址，若為空則使用模擬資料
const GAS_API_URL = "https://script.google.com/macros/s/AKfycby6jEHc0kSPE58EJPs9dqZkATVu2srXh6gi1ElIrH1RuS7veEVBMSHFuH-jZEYqwlpK/exec";

const SEARCH_RADIUS_KM = 3;
const AUTO_REFRESH_INTERVAL = 60000; 

const CITIES = [
    { id: 'Keelung', name: '基隆市', type: 'dynamic', lat: 25.1276, lng: 121.7392 },
    { id: 'Taipei', name: '台北市', type: 'dynamic', lat: 25.0330, lng: 121.5654 },
    { id: 'NewTaipei', name: '新北市', type: 'dynamic', lat: 25.0169, lng: 121.4628 },
    { id: 'Taoyuan', name: '桃園市', type: 'dynamic', lat: 24.9936, lng: 121.3009 },
    { id: 'Hsinchu', name: '新竹市', type: 'dynamic', lat: 24.8138, lng: 120.9675 },
    { id: 'HsinchuCounty', name: '新竹縣', type: 'dynamic', lat: 24.8397, lng: 121.0104 },
    { id: 'Taichung', name: '台中市', type: 'dynamic', lat: 24.1477, lng: 120.6736 },
    { id: 'Tainan', name: '台南市', type: 'dynamic', lat: 22.9997, lng: 120.2270 },
    { id: 'Kaohsiung', name: '高雄市', type: 'dynamic', lat: 22.6273, lng: 120.3014 },
    { id: 'YilanCounty', name: '宜蘭縣', type: 'dynamic', lat: 24.7021, lng: 121.7377 },
    { id: 'Chiayi', name: '嘉義市', type: 'static', lat: 23.4800, lng: 120.4491 },
    { id: 'HualienCounty', name: '花蓮縣', type: 'static', lat: 23.9871, lng: 121.6011 },
    { id: 'TaitungCounty', name: '台東縣', type: 'static', lat: 22.7583, lng: 121.1444 },
];

const IconBase = ({ children, size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {children}
    </svg>
);

const Navigation = (props) => <IconBase {...props}><polygon points="3 11 22 2 13 21 11 13 3 11"/></IconBase>;
const RefreshCw = (props) => <IconBase {...props}><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></IconBase>;
const List = (props) => <IconBase {...props}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></IconBase>;
const MapIcon = (props) => <IconBase {...props}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></IconBase>;
const Info = (props) => <IconBase {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></IconBase>;
const Volume2 = (props) => <IconBase {...props}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></IconBase>;
const Search = (props) => <IconBase {...props}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></IconBase>;
const X = (props) => <IconBase {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></IconBase>;

// 企鵝 Logo - 改為深色線條
const PenguinLogo = () => (
    <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
        <circle cx="50" cy="50" r="45" stroke="#0284c7" strokeWidth="2" strokeDasharray="10 5" opacity="0.5" className="radar-scan" />
        <circle cx="50" cy="50" r="35" stroke="#0284c7" strokeWidth="1" opacity="0.3" />
        <path d="M50 20C40 20 32 28 32 40V70C32 78 38 85 50 85C62 85 68 78 68 70V40C68 28 60 20 50 20Z" fill="#e2e8f0" />
        <path d="M50 20C40 20 32 28 32 40V70C32 78 35 85 50 85" fill="#334155" /> 
        <path d="M30 50L20 55" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round"/> 
        <path d="M70 50L80 55" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round"/> 
        <circle cx="45" cy="35" r="2" fill="#0f172a" />
        <circle cx="55" cy="35" r="2" fill="#0f172a" />
        <path d="M48 40L50 42L52 40" stroke="#f59e0b" strokeWidth="2" /> 
        <path d="M40 85L35 90" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round"/> 
        <path d="M60 85L65 90" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round"/> 
    </svg>
);

const generateMockData = (centerLat, centerLng) => {
    const mocks = [];
    for (let i = 0; i < 20; i++) {
        const lat = centerLat + (Math.random() - 0.5) * 0.04;
        const lng = centerLng + (Math.random() - 0.5) * 0.04;
        const total = Math.floor(Math.random() * 200) + 20;
        const rand = Math.random();
        let available;
        if(rand > 0.8) available = -1;
        else available = Math.floor(Math.random() * total);

        mocks.push({
            id: `mock-${i}`,
            name: `測試停車場 ${i+1}號`,
            lat, lng,
            total,
            available,
            fare: '每小時 30 元，當日最高 150 元',
            city: 'MockCity',
            address: '測試地址路段100號'
        });
    }
    return mocks;
};

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2-lat1) * (Math.PI/180); 
    const dLon = (lon2-lon1) * (Math.PI/180); 
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
}

function App() {
    const [viewMode, setViewMode] = useState('map');
    const [userLocation, setUserLocation] = useState(null);
    const [parkings, setParkings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCity, setSelectedCity] = useState(CITIES[1].id); 
    const [lastUpdated, setLastUpdated] = useState(null);
    const [showInstruction, setShowInstruction] = useState(true);
    const [locationStatus, setLocationStatus] = useState('定位中...');

    const mapRef = useRef(null);
    const markerLayerRef = useRef(null);

    useEffect(() => {
        const findNearestCity = (lat, lng) => {
            let minDistance = Infinity;
            let nearestCity = CITIES[1].id; 
            CITIES.forEach(city => {
                const dist = getDistanceFromLatLonInKm(lat, lng, city.lat, city.lng);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestCity = city.id;
                }
            });
            return nearestCity;
        };

        const handleSuccess = (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            setLocationStatus('定位成功，搜尋周邊...');
            const nearestCityId = findNearestCity(latitude, longitude);
            setSelectedCity(nearestCityId);
            loadData(latitude, longitude, nearestCityId);
        };

        const handleError = (error) => {
            let msg = error.message || '未知原因';
            console.warn(`定位失敗 (${msg})，切換至預設位置`);
            const defLat = 25.0478;
            const defLng = 121.5170;
            setUserLocation({ lat: defLat, lng: defLng });
            loadData(defLat, defLng, selectedCity);
            setLocationStatus('定位失敗，使用預設');
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                handleSuccess,
                handleError,
                { timeout: 8000, enableHighAccuracy: false, maximumAge: 0 }
            );
        } else {
            handleError({ message: "瀏覽器不支援" });
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (userLocation) {
                console.log("Auto refreshing data...");
                loadData(userLocation.lat, userLocation.lng, selectedCity, true);
            }
        }, AUTO_REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [userLocation, selectedCity]);

    const loadData = async (lat, lng, city, isSilent = false) => {
        if (!isSilent) setLoading(true);

        try {
            let data = [];
            if (GAS_API_URL) {
                const url = `${GAS_API_URL}?lat=${lat}&lng=${lng}&radius=${SEARCH_RADIUS_KM * 1000}&city=${city}`;
                const res = await fetch(url);
                const json = await res.json();
                if (json.status === 'success') {
                    data = json.data;
                }
            } else {
                console.log("Using Mock Data");
                await new Promise(r => setTimeout(r, 800));
                data = generateMockData(lat, lng);
            }
            
            data.forEach(p => {
                p.distance = getDistanceFromLatLonInKm(lat, lng, p.lat, p.lng);
            });
            data.sort((a, b) => a.distance - b.distance);

            setParkings(data);
            setLastUpdated(new Date());
            
            if (mapRef.current) {
                updateMapMarkers(data);
            }
            if (!isSilent) setLocationStatus('系統運作正常');

        } catch (error) {
            console.error("Fetch data error:", error);
            setLocationStatus('資料讀取錯誤');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!mapRef.current && userLocation) {
            mapRef.current = L.map('map-container', {
                zoomControl: false,
                attributionControl: false
            }).setView([userLocation.lat, userLocation.lng], 15);

            // 改用 CartoDB Positron (淺色)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }).addTo(mapRef.current);

            const userIcon = L.divIcon({
                className: 'user-marker-container',
                html: '<div class="user-pulse"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(mapRef.current);
            
            markerLayerRef.current = L.layerGroup().addTo(mapRef.current);
            
            if (parkings.length > 0) {
                updateMapMarkers(parkings);
            }
        }
    }, [userLocation]);

    const updateMapMarkers = (data) => {
        if (!markerLayerRef.current) return;
        markerLayerRef.current.clearLayers();

        data.forEach(p => {
            let colorClass = 'marker-grey';
            let availableText = '?';
            
            if (p.available !== -1) {
                availableText = p.available.toString();
                const ratio = p.total > 0 ? (p.available / p.total) : 0;
                if (p.available === 0 || ratio < 0.1) {
                    colorClass = 'marker-red';
                } else if (ratio < 0.3) {
                    colorClass = 'marker-yellow';
                } else {
                    colorClass = 'marker-green';
                }
            }

            const icon = L.divIcon({
                className: `custom-bubble-icon`,
                html: `<div class="marker-bubble ${colorClass}">${availableText}</div>`,
                iconSize: [34, 34],
                iconAnchor: [17, 17]
            });

            const marker = L.marker([p.lat, p.lng], { icon: icon });
            
            // 淺色模式的 Popup 文字顏色調整
            const popupContent = `
                <div class="font-sans min-w-[200px]">
                    <h3 class="font-bold text-sky-600 text-lg mb-1">${p.name}</h3>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-slate-500 text-sm">總車位: ${p.total}</span>
                        <span class="text-2xl font-bold ${colorClass.replace('marker-', 'text-')}">
                            ${p.available === -1 ? '未知' : p.available}
                        </span>
                    </div>
                    <div class="text-xs text-slate-500 mb-2">${p.fare}</div>
                    <button id="nav-btn-${p.id}" style="width:100%" class="bg-sky-500 hover:bg-sky-600 text-white text-sm py-2 px-3 rounded-full flex items-center justify-center gap-2 transition shadow-md">
                        導航前往
                    </button>
                </div>
            `;
            
            marker.bindPopup(popupContent, { className: 'custom-popup', closeButton: true });
            marker.on('popupopen', () => {
                const btn = document.getElementById(`nav-btn-${p.id}`);
                if (btn) btn.onclick = () => handleNavigation(p.name, p.lat, p.lng);
            });
            
            marker.addTo(markerLayerRef.current);
        });
    };

    const handleNavigation = (name, lat, lng) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`導航開始，前往 ${name}`);
            utterance.lang = 'zh-TW';
            window.speechSynthesis.speak(utterance);
        }
        setTimeout(() => {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        }, 1000);
    };

    return (
        <div className="relative w-full h-full">
            <div id="map-container" className={viewMode === 'list' ? 'hidden' : 'block'}></div>
            
            {viewMode === 'list' && (
                <div className="absolute inset-0 bg-slate-100 overflow-y-auto pb-32">
                        <div className="p-4 pt-24 max-w-md mx-auto space-y-4">
                        {parkings.map((p) => {
                            let statusColor = p.available === -1 ? 'text-slate-400' : 
                                (p.available === 0 || p.available/p.total < 0.1) ? 'text-red-500' :
                                (p.available/p.total < 0.3) ? 'text-yellow-500' : 'text-green-500';
                            
                            return (
                                <div key={p.id} className="glass-panel p-4 rounded-xl border-l-4 border-sky-500 transform transition hover:scale-[1.02] bg-white shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">{p.name}</h3>
                                            <p className="text-xs text-slate-500 mt-1">{p.distance.toFixed(1)} km | {p.city}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold ${statusColor}`}>
                                                {p.available === -1 ? '?' : p.available}
                                                <span className="text-xs text-slate-500 block">剩餘</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 line-clamp-1">{p.fare}</p>
                                    <button 
                                        onClick={() => handleNavigation(p.name, p.lat, p.lng)}
                                        className="mt-3 w-full bg-sky-100 hover:bg-sky-200 text-sky-700 py-2 rounded-lg text-sm flex items-center justify-center gap-2 font-medium"
                                    >
                                        <Navigation size={14} /> 立即前往
                                    </button>
                                </div>
                            )
                        })}
                        {parkings.length === 0 && !loading && (
                            <div className="text-center text-slate-500 mt-10">附近 3 公里內無資料</div>
                        )}
                    </div>
                </div>
            )}

            <div className="absolute top-0 left-0 right-0 z-[500] p-4">
                <div className="glass-panel rounded-2xl p-3 flex justify-between items-center neon-border">
                    <div className="flex items-center">
                        <PenguinLogo />
                        <div>
                            <h1 className="text-lg font-bold text-slate-800">小企鵝雷達</h1>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                {loading ? <RefreshCw size={10} className="animate-spin"/> : <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                                {loading ? '掃描中...' : locationStatus}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setShowInstruction(true)} className="p-2 rounded-full text-slate-500 hover:bg-slate-200">
                        <Info size={20} />
                    </button>
                </div>
            </div>

            <div className="absolute bottom-6 left-4 right-4 z-[500] flex flex-col gap-3 max-w-md mx-auto">
                <div className="flex justify-between items-end">
                    <div className="glass-panel rounded-lg px-3 py-1 text-[10px] text-slate-500">
                        上次更新: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--'}
                    </div>
                    {viewMode === 'map' && mapRef.current && (
                        <div className="flex flex-col gap-1">
                            <button onClick={() => mapRef.current.zoomIn()} className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-slate-700 text-xl shadow">+</button>
                            <button onClick={() => mapRef.current.zoomOut()} className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-slate-700 text-xl shadow">-</button>
                        </div>
                    )}
                </div>

                <div className="glass-panel rounded-2xl p-2 grid grid-cols-4 gap-2 neon-border">
                    <div className="col-span-2 relative">
                        <select 
                            value={selectedCity}
                            onChange={(e) => {
                                setSelectedCity(e.target.value);
                                if (userLocation) loadData(userLocation.lat, userLocation.lng, e.target.value);
                            }}
                            className="w-full h-full bg-white/50 text-slate-800 text-sm rounded-xl pl-8 pr-2 appearance-none outline-none border border-slate-200 focus:border-sky-500"
                        >
                            {CITIES.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.type === 'dynamic' ? '🟢' : '⚪'}
                                </option>
                            ))}
                        </select>
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                    </div>

                    <button 
                        onClick={() => setViewMode('map')}
                        className={`flex flex-col items-center justify-center py-2 rounded-xl transition ${viewMode === 'map' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <MapIcon size={18} />
                        <span className="text-[10px] mt-1">雷達</span>
                    </button>

                    <button 
                        onClick={() => setViewMode('list')}
                        className={`flex flex-col items-center justify-center py-2 rounded-xl transition ${viewMode === 'list' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List size={18} />
                        <span className="text-[10px] mt-1">推薦</span>
                    </button>
                </div>
            </div>

            {showInstruction && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="glass-panel max-w-sm w-full rounded-2xl p-6 border border-white shadow-2xl relative bg-white/95">
                        <button onClick={() => setShowInstruction(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
                            <X size={20} />
                        </button>
                        
                        <div className="text-center mb-4">
                            <PenguinLogo />
                            <h2 className="text-xl font-bold text-slate-800 mt-2">歡迎使用小企鵝雷達</h2>
                        </div>

                        <div className="space-y-3 text-sm text-slate-600">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                    0
                                </div>
                                <p className="mt-1.5"><span className="text-red-500 font-bold">紅色泡泡</span>：已滿位。</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                    5
                                </div>
                                <p className="mt-1.5"><span className="text-yellow-500 font-bold">黃色泡泡</span>：車位緊張 (&lt;30%)。</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                    28
                                </div>
                                <p className="mt-1.5"><span className="text-green-500 font-bold">綠色泡泡</span>：車位充裕 (&gt;30%)。</p>
                            </div>
                            <div className="flex items-start gap-3 mt-2">
                                <Volume2 size={16} className="mt-0.5 text-sky-500" />
                                <p>系統會自動定位並搜尋最近的城市資料。點擊泡泡可查看導航。</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowInstruction(false)}
                            className="mt-6 w-full bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-bold shadow-md transition"
                        >
                            開始掃描
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
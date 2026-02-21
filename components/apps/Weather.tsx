'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { useWindows } from '../WindowContext';

interface GeoResult { name: string; country: string; latitude: number; longitude: number }
interface CurrentWeather { temp: number; feelsLike: number; humidity: number; wind: number; pressure: number; uv: number; code: number }
interface DailyForecast { day: string; code: number; high: number; low: number; sunrise: string; sunset: string }
interface HourlyPoint { time: string; temp: number; code: number }

const WMO: Record<number, [string, string]> = {
    0: ['Clear Sky', '\u2600\uFE0F'], 1: ['Mainly Clear', '\uD83C\uDF24\uFE0F'], 2: ['Partly Cloudy', '\u26C5'], 3: ['Overcast', '\u2601\uFE0F'],
    45: ['Fog', '\uD83C\uDF2B\uFE0F'], 48: ['Rime Fog', '\uD83C\uDF2B\uFE0F'], 51: ['Light Drizzle', '\uD83C\uDF26\uFE0F'], 53: ['Drizzle', '\uD83C\uDF26\uFE0F'],
    55: ['Dense Drizzle', '\uD83C\uDF27\uFE0F'], 61: ['Light Rain', '\uD83C\uDF27\uFE0F'], 63: ['Rain', '\uD83C\uDF27\uFE0F'], 65: ['Heavy Rain', '\uD83C\uDF27\uFE0F'],
    71: ['Light Snow', '\uD83C\uDF28\uFE0F'], 73: ['Snow', '\u2744\uFE0F'], 75: ['Heavy Snow', '\u2744\uFE0F'], 77: ['Snow Grains', '\u2744\uFE0F'],
    80: ['Light Showers', '\uD83C\uDF26\uFE0F'], 81: ['Showers', '\uD83C\uDF27\uFE0F'], 82: ['Heavy Showers', '\u26C8\uFE0F'],
    95: ['Thunderstorm', '\u26A1'], 96: ['Hail Storm', '\u26A1'], 99: ['Severe Storm', '\u26A1'],
};

function weatherInfo(code: number): [string, string] {
    return WMO[code] || WMO[Object.keys(WMO).map(Number).reduce((p, c) => Math.abs(c - code) < Math.abs(p - code) ? c : p)] || ['Unknown', '\u2601\uFE0F'];
}

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Weather({ appId = 'weather', id }: { appId?: string; id?: string }) {
    const { activewindow } = useWindows();
    const isActiveWindow = activewindow === id;

    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
    const [city, setCity] = useState<GeoResult | null>(null);
    const [current, setCurrent] = useState<CurrentWeather | null>(null);
    const [daily, setDaily] = useState<DailyForecast[]>([]);
    const [hourly, setHourly] = useState<HourlyPoint[]>([]);
    const [useFahrenheit, setUseFahrenheit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const weatherMenus = useMemo(() => ({
        View: [
            { title: 'Celsius', actionId: 'unit-c', shortcut: '\u2318C' },
            { title: 'Fahrenheit', actionId: 'unit-f', shortcut: '\u2318F' },
        ],
        Weather: [
            { title: 'Refresh', actionId: 'weather-refresh', shortcut: '\u2318R' },
        ],
    }), []);

    const menuActions = useMemo(() => ({
        'unit-c': () => setUseFahrenheit(false),
        'unit-f': () => setUseFahrenheit(true),
        'weather-refresh': () => { if (city) fetchWeather(city); },
    }), [city]); // eslint-disable-line react-hooks/exhaustive-deps

    useMenuRegistration(weatherMenus, isActiveWindow);
    useMenuAction(appId, menuActions, id);

    const toUnit = useCallback((c: number) => useFahrenheit ? Math.round(c * 9 / 5 + 32) : Math.round(c), [useFahrenheit]);
    const unitLabel = useFahrenheit ? '\u00B0F' : '\u00B0C';

    const fetchWeather = useCallback(async (geo: GeoResult) => {
        setLoading(true);
        setError('');
        try {
            const r = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}` +
                `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,uv_index` +
                `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
                `&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=5`
            );
            const d = await r.json();
            setCurrent({
                temp: d.current.temperature_2m, feelsLike: d.current.apparent_temperature,
                humidity: d.current.relative_humidity_2m, wind: d.current.wind_speed_10m,
                pressure: d.current.surface_pressure, uv: d.current.uv_index, code: d.current.weather_code,
            });
            setDaily(d.daily.time.map((t: string, i: number) => ({
                day: new Date(t).toLocaleDateString([], { weekday: 'short' }),
                code: d.daily.weather_code[i], high: d.daily.temperature_2m_max[i],
                low: d.daily.temperature_2m_min[i], sunrise: d.daily.sunrise[i], sunset: d.daily.sunset[i],
            })));
            const now = new Date();
            const hrs = d.hourly.time.map((t: string, i: number) => ({ time: t, temp: d.hourly.temperature_2m[i], code: d.hourly.weather_code[i] }))
                .filter((h: HourlyPoint) => new Date(h.time) >= now).slice(0, 24);
            setHourly(hrs);
            localStorage.setItem('weather-last-city', JSON.stringify(geo));
        } catch { setError('Failed to fetch weather data.'); }
        setLoading(false);
    }, []);

    const searchCity = useCallback(async (name: string) => {
        if (name.length < 2) { setSuggestions([]); return; }
        try {
            const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5`);
            const d = await r.json();
            setSuggestions((d.results || []).map((r: any) => ({ name: r.name, country: r.country || '', latitude: r.latitude, longitude: r.longitude })));
        } catch { setSuggestions([]); }
    }, []);

    const selectCity = useCallback((geo: GeoResult) => {
        setCity(geo);
        setQuery('');
        setSuggestions([]);
        fetchWeather(geo);
    }, [fetchWeather]);

    useEffect(() => {
        const saved = localStorage.getItem('weather-last-city');
        if (saved) { try { const g = JSON.parse(saved); setCity(g); fetchWeather(g); return; } catch {} }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => { const g = { name: 'Current Location', country: '', latitude: pos.coords.latitude, longitude: pos.coords.longitude }; setCity(g); fetchWeather(g); },
                () => { const g = { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 }; setCity(g); fetchWeather(g); }
            );
        } else {
            const g = { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 };
            setCity(g);
            fetchWeather(g);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { const t = setTimeout(() => searchCity(query), 300); return () => clearTimeout(t); }, [query, searchCity]);

    const [desc, emoji] = current ? weatherInfo(current.code) : ['--', '\u2601\uFE0F'];

    return (
        <div className="h-full flex flex-col bg-[--bg-base] text-[--text-color] overflow-hidden select-none font-mono">
            {/* Search */}
            <div className="relative px-4 pt-3 pb-2">
                <input
                    className="w-full bg-overlay border border-[--border-color] px-3 py-2 text-[13px] outline-none text-[--text-color] placeholder-[--text-muted] focus:border-accent"
                    placeholder="Search city..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {suggestions.length > 0 && (
                    <div className="absolute left-4 right-4 top-full mt-1 z-50 bg-overlay border border-[--border-color] overflow-hidden">
                        {suggestions.map((s, i) => (
                            <button key={i} className="w-full text-left px-3 py-2 text-[13px] hover:bg-surface transition-colors truncate" onClick={() => selectCity(s)}>
                                {s.name}, {s.country}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {loading && !current ? (
                <div className="flex-1 flex items-center justify-center text-[--text-muted] text-[13px]">Loading weather...</div>
            ) : error ? (
                <div className="flex-1 flex items-center justify-center text-pastel-red text-[13px]">{error}</div>
            ) : current ? (
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className="max-w-[640px] mx-auto">
                        {/* Current Weather Hero */}
                        <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Current Weather</div>
                        <div className="bg-overlay border border-[--border-color] overflow-hidden mb-6">
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[11px] text-[--text-muted] uppercase tracking-wide">{city?.name}{city?.country ? `, ${city.country}` : ''}</p>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-5xl font-extralight tracking-tight text-[--text-color]">{toUnit(current.temp)}{unitLabel}</span>
                                            <button onClick={() => setUseFahrenheit(!useFahrenheit)} className="text-[11px] text-pastel-blue hover:underline cursor-pointer">
                                                {useFahrenheit ? '\u00B0C' : '\u00B0F'}
                                            </button>
                                        </div>
                                        <p className="text-[13px] text-[--text-muted] mt-1">{desc}</p>
                                    </div>
                                    <span className="text-6xl mt-1">{emoji}</span>
                                </div>
                            </div>
                            <div className="border-t border-[--border-color]">
                                <div className="grid grid-cols-4">
                                    {[
                                        ['Feels Like', `${toUnit(current.feelsLike)}${unitLabel}`, 'text-pastel-peach'],
                                        ['Humidity', `${current.humidity}%`, 'text-pastel-blue'],
                                        ['Wind', `${Math.round(current.wind)} km/h`, 'text-pastel-teal'],
                                        ['UV Index', `${Math.round(current.uv)}`, 'text-pastel-red'],
                                    ].map(([label, val, color], i) => (
                                        <div key={label as string} className={`text-center py-3 ${i < 3 ? 'border-r border-[--border-color]' : ''}`}>
                                            <p className="text-[10px] text-[--text-muted] uppercase tracking-wider">{label}</p>
                                            <p className={`text-[13px] font-medium mt-0.5 ${color}`}>{val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Hourly Forecast */}
                        <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Hourly Forecast</div>
                        <div className="bg-overlay border border-[--border-color] overflow-hidden mb-6">
                            <div className="flex gap-3 overflow-x-auto p-4 scrollbar-none">
                                {hourly.map((h, i) => {
                                    const [, hEmoji] = weatherInfo(h.code);
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-1 min-w-[3.5rem]">
                                            <span className="text-[10px] text-[--text-muted]">{i === 0 ? 'Now' : fmtTime(h.time)}</span>
                                            <span className="text-lg">{hEmoji}</span>
                                            <span className="text-[11px] font-medium text-[--text-color]">{toUnit(h.temp)}°</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 5-Day Forecast */}
                        <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">5-Day Forecast</div>
                        <div className="bg-overlay border border-[--border-color] overflow-hidden mb-6">
                            {daily.map((d, i) => {
                                const [, dEmoji] = weatherInfo(d.code);
                                const range = daily.reduce((a, c) => [Math.min(a[0], c.low), Math.max(a[1], c.high)], [Infinity, -Infinity]);
                                const pct = (v: number) => ((v - range[0]) / (range[1] - range[0])) * 100;
                                return (
                                    <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${i < daily.length - 1 ? 'border-b border-[--border-color]' : ''}`}>
                                        <span className="text-[13px] w-10 text-[--text-muted] font-medium">{i === 0 ? 'Today' : d.day}</span>
                                        <span className="text-base w-6 text-center">{dEmoji}</span>
                                        <span className="text-[13px] text-pastel-blue w-10 text-right">{toUnit(d.low)}°</span>
                                        <div className="flex-1 h-1 bg-[--border-color] relative overflow-hidden">
                                            <div
                                                className="absolute h-full bg-accent"
                                                style={{ left: `${pct(d.low)}%`, right: `${100 - pct(d.high)}%` }}
                                            />
                                        </div>
                                        <span className="text-[13px] text-pastel-peach w-10">{toUnit(d.high)}°</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Details */}
                        {daily.length > 0 && (
                            <>
                                <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Details</div>
                                <div className="bg-overlay border border-[--border-color] overflow-hidden mb-6">
                                    {[
                                        ['Sunrise', fmtTime(daily[0].sunrise), '\uD83C\uDF05'],
                                        ['Sunset', fmtTime(daily[0].sunset), '\uD83C\uDF07'],
                                        ['Pressure', `${Math.round(current.pressure)} hPa`, '\uD83D\uDCCA'],
                                        ['Visibility', 'Good', '\uD83D\uDC41\uFE0F'],
                                    ].map(([label, val, icon], i, arr) => (
                                        <div key={label as string} className={`flex items-center justify-between px-4 py-2.5 ${i < arr.length - 1 ? 'border-b border-[--border-color]' : ''}`}>
                                            <span className="text-[13px] font-medium text-[--text-color] flex items-center gap-2">
                                                <span>{icon}</span> {label}
                                            </span>
                                            <span className="text-[13px] text-[--text-muted]">{val}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

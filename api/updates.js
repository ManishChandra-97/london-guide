const cityHallEvents = 'https://www.london.gov.uk/events?type=438';

const clean = value => value.replace(/<!\[CDATA\[|]]>/g, '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const getTag = (xml, tag) => clean((xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i')) || [])[1] || '');
const time = date => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' }).format(date);

async function remote(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'London-Visitor-Compass/1.0', Accept: 'application/json, application/rss+xml, application/xml, text/html;q=0.9' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return response.text();
}

async function bbcUpdates() {
  const xml = await remote('https://feeds.bbci.co.uk/news/england/london/rss.xml');
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0, 2).map(match => ({ type: '▣', source: 'BBC News London', text: getTag(match[1], 'title'), url: getTag(match[1], 'link'), time: 'News' }));
}

async function cityNewsUpdate() {
  const xml = await remote('https://news.cityoflondon.gov.uk/feed/');
  const item = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)][0]?.[1];
  return item ? { type: '▤', source: 'City of London', text: getTag(item, 'title'), url: getTag(item, 'link'), time: 'News' } : null;
}

async function eventUpdates() {
  const html = await remote(cityHallEvents);
  const matches = [...html.matchAll(/<h2[^>]*>[\s\S]{0,300}?<a\s+href="([^"]+)"[\s\S]{0,300}?<span>([^<]+)<\/span>[\s\S]{0,2500}?<strong>Date\(s\):<\/strong>[\s\S]{0,450}?<time[^>]*>([^<]+)<\/time>/gi)];
  return matches.slice(0, 2).map(match => ({ type: '✦', source: 'London City Hall event', text: `${clean(match[2])} · ${clean(match[3])}`, url: new URL(match[1], 'https://www.london.gov.uk').href, time: 'Event' }));
}

async function travelUpdate() {
  const lines = JSON.parse(await remote('https://api.tfl.gov.uk/line/mode/tube/status'));
  const disrupted = lines.find(line => line.lineStatuses?.[0]?.statusSeverityDescription !== 'Good Service') || lines[0];
  const status = disrupted?.lineStatuses?.[0];
  return { type: '◉', source: 'TfL', text: `${disrupted?.name || 'Tube'}: ${status?.statusSeverityDescription || 'Check service status'}${status?.reason ? ` — ${clean(status.reason)}` : ''}`, url: 'https://tfl.gov.uk/tube-dlr-overground/status/', time: 'Travel' };
}

async function weatherUpdate() {
  const weather = JSON.parse(await remote('https://api.open-meteo.com/v1/forecast?latitude=51.5072&longitude=-0.1276&current=temperature_2m,apparent_temperature,weather_code&timezone=Europe%2FLondon'));
  const current = weather.current;
  const conditions = { 0: 'clear skies', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast', 45: 'fog', 48: 'rime fog', 51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle', 61: 'slight rain', 63: 'rain', 65: 'heavy rain', 71: 'light snow', 80: 'rain showers', 81: 'rain showers', 82: 'heavy rain showers', 95: 'thunderstorm' };
  return { type: '☁', source: 'Open-Meteo', text: `Central London: ${Math.round(current.temperature_2m)}°C, feels like ${Math.round(current.apparent_temperature)}°C · ${conditions[current.weather_code] || 'weather conditions available'}`, url: 'https://open-meteo.com/', time: 'Weather' };
}

module.exports = async (request, response) => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  try {
    const results = await Promise.allSettled([bbcUpdates(), cityNewsUpdate(), eventUpdates(), travelUpdate(), weatherUpdate()]);
    const updates = results.flatMap(result => result.status === 'fulfilled' ? (Array.isArray(result.value) ? result.value : [result.value]) : []).filter(Boolean);
    if (!updates.length) throw new Error('All live sources were unavailable');
    response.status(200).json({ updatedAt: time(new Date()), updates });
  } catch {
    response.status(502).json({ error: 'Live updates are temporarily unavailable.' });
  }
};

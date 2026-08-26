# London Visitor Compass

A responsive London discovery dashboard with curated real locations and live city updates.

## Run locally

Run `npm start`, then open [http://localhost:4173](http://localhost:4173). This builds the app and starts the local server in one command—there is no need to open `index.html` directly.

If you have already run `npm run build`, run `npm run preview` and open [http://localhost:4173](http://localhost:4173).

## Live data and compliance

- The update bar requests BBC London News, City of London news, London City Hall events, TfL line status and Open-Meteo weather each time the page opens or Refresh is pressed. The requests are made by the local Node server, avoiding browser cross-origin restrictions.
- Map pins are real London visitor locations; each detail panel links to the venue’s official page for current opening hours and tickets.
- Saved places stay in browser `localStorage`; no account or precise location is persisted.
- The app uses no API keys. Keep server-side credentials private if you add authenticated source adapters later.

## Manual checks

- Search, category and quick filters update both pins and list fallback.
- Selecting a pin/list result opens a sourced detail card; directions and TfL actions are outbound official/attributed links.
- The update ticker refreshes with current source data on page load and on demand; saved plans appear on the map regardless of the filters that were previously active.
- On narrow screens filters are in a sheet and details become a drawer.

## Sources and links

The application uses these external services and source guidance:

- [Leaflet](https://leafletjs.com/) — map library, loaded from [unpkg's Leaflet package](https://unpkg.com/leaflet@1.9.4/).
- [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright) — base-map attribution and directions links; tiles are requested from [the OpenStreetMap standard tile service](https://operations.osmfoundation.org/policies/tiles/).
- [Transport for London Unified API](https://tfl.gov.uk/info-for/open-data-users/unified-api) — current tube status.
- [BBC News London](https://feeds.bbci.co.uk/news/england/london/rss.xml), [City of London News](https://news.cityoflondon.gov.uk/feed/) and [London City Hall Events](https://www.london.gov.uk/events?type=438) — current headlines and upcoming events.
- [Open-Meteo](https://open-meteo.com/) — current central-London weather.

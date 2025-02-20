Grafana <-> JSON API <-> Loki
```

- Grafana sends queries to the JSON API
- JSON API transforms Grafana queries to Loki queries
- Loki responds with log data
- JSON API transforms Loki response to Grafana format

## API Endpoints

### Query Endpoint
```
POST /api/query
```
Main endpoint for retrieving log data. Supports time range filtering and adhoc filters. Queries are transformed and forwarded to Loki.

### Variable Support
```
POST /api/tag-keys
POST /api/tag-values
```
Endpoints for Grafana variable support, allowing dynamic filtering based on log tags.

### Health Check
```
GET /api/health
```
Endpoint for monitoring data source availability.

## Query Format

The API accepts Grafana queries in the following format:

```json
{
  "range": {
    "from": "2025-02-13T00:00:00.000Z",
    "to": "2025-02-13T23:59:59.999Z"
  },
  "targets": [
    {
      "target": "logs",
      "refId": "A",
      "type": "table"
    }
  ],
  "adhocFilters": [
    {
      "key": "tags_Computer",
      "operator": "=",
      "value": "OPCITSNAW006E.jnj.com"
    }
  ]
}
```

## Usage in Grafana

1. **Add Data Source**:
   - Add a new JSON API data source in Grafana
   - Set the URL to your server's address
   - Enable `Basic Auth` if required

2. **Configure Variables**:
   - Create variables using the tag-keys endpoint
   - Use these variables in dashboard queries
   - Example variable: `$Computer` will use values from `tags_Computer`

## Development

### Prerequisites
- Node.js
- npm

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Loki URL in `server/services/loki.ts`
4. Start the development server:
   ```bash
   npm run dev
# Grafana JSON API Data Source for Complex Log Management

A robust Grafana JSON API data source designed for handling multiline log data with advanced variable support and complex event record identification.

## Features

- **Multiline Log Support**: Handles complex log entries with multiline data fields while maintaining data integrity
- **Unique Event Record Tracking**: Uses `EventRecordID` for precise log entry identification
- **Dynamic Tag-based Variables**: Supports Grafana variables through log tags
- **Comprehensive API Endpoints**: Full suite of Grafana integration endpoints

## API Endpoints

### Query Endpoint
```
POST /api/query
```
Main endpoint for retrieving log data. Supports time range filtering and adhoc filters.

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

## Log Format

The API accepts log entries in the following JSON format:

```json
{
  "fields_Data": "Error: 60000 Severity: 10 State: 1 \nStartTime:02/13/2025 06:58:57 \nTraceType:sec \nEventClassDesc:Audit Logout \nLoginName:NA\\SA-PRD-truviewviewer \nHostName:OPCITSNAW0050 \nTextData:N/A \nApplicationName:Core .Net SqlClient Data Provider \nDatabaseName:DEVVIEWERTVCTRL \nObjectName:N/A \nRoleName:N/A",
  "fields_EventRecordID": "5479302635",
  "fields_Message": "Error: 60000 Severity: 10 State: 1",
  "level": "info",
  "tags_Channel": "SQLAudit",
  "tags_Computer": "OPCITSNAW006E.jnj.com",
  "tags_EventID": "17061",
  "tags_Level": "4",
  "tags_Source": "MSSQL",
  "timestamp": "1739449285"
}
```

### Key Components:

- `fields_Data`: Contains multiline log information
- `fields_EventRecordID`: Unique identifier for each log entry
- `tags_*`: Prefix for variables that can be used in Grafana for filtering
- `timestamp`: Unix timestamp of the log entry

## Usage in Grafana

1. **Add Data Source**:
   - Add a new JSON API data source in Grafana
   - Set the URL to your server's address
   - Enable `Basic Auth` if required

2. **Configure Variables**:
   - Create variables using the tag-keys endpoint
   - Use these variables in dashboard queries
   - Example variable: `$Computer` will use values from `tags_Computer`

3. **Query Structure**:
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
3. Start the development server:
   ```bash
   npm run dev
   ```

### Testing Log Insertion
Use the test endpoint to insert sample logs:
```bash
curl -X POST http://localhost:5000/api/test/insert-log \
  -H "Content-Type: application/json" \
  -d '{
    "fields_Data": "Error: 60000...",
    "fields_EventRecordID": "5479302635",
    "level": "info",
    "tags_Computer": "test.computer"
  }'
```

## Architecture

- **Log Parsing**: Complex log entries are parsed in `logParser.ts` with multiline support
- **Storage**: Uses in-memory storage (can be extended to use databases)
- **Variable Support**: Dynamic tag extraction for Grafana variables
- **Error Handling**: Comprehensive error handling with detailed error messages

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

import type { Express } from "express";
import { createServer, type Server } from "http";
import cors from "cors";
import { storage } from "./storage";
import { querySchema, logEntrySchema } from "@shared/schema";
import { parseLogEntry, formatGrafanaResponse } from "./utils/logParser";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS for Grafana
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Grafana Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Search endpoint for variable support
  app.post('/api/search', (_req, res) => {
    res.json(['logs']);
  });

  // Main query endpoint
  app.post('/api/query', async (req, res) => {
    try {
      const query = querySchema.parse(req.body);
      const from = new Date(query.range.from);
      const to = new Date(query.range.to);

      // Extract filters from adhocFilters
      const filters = query.adhocFilters?.reduce((acc, filter) => {
        acc[filter.key] = filter.value;
        return acc;
      }, {} as Record<string, string>);

      const logs = await storage.getLogs(from, to, filters);
      const parsedLogs = logs.map(log => parseLogEntry(log));
      
      res.json(formatGrafanaResponse(parsedLogs));
    } catch (error) {
      console.error('Query error:', error);
      res.status(400).json({ error: 'Invalid query parameters' });
    }
  });

  // Annotations endpoint
  app.post('/api/annotations', (_req, res) => {
    res.json([]);
  });

  // Tag keys endpoint for variable support
  app.post('/api/tag-keys', (_req, res) => {
    res.json([
      { type: 'string', text: 'Computer' },
      { type: 'string', text: 'Level' }
    ]);
  });

  // Tag values endpoint for variable support
  app.post('/api/tag-values', (req, res) => {
    const key = req.body.key;
    if (key === 'Level') {
      res.json(['error', 'warn', 'info', 'debug', 'trace'].map(v => ({ text: v })));
    } else {
      res.json([]);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

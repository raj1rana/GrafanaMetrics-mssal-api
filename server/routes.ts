import type { Express } from "express";
import { createServer, type Server } from "http";
import express from 'express';
import { storage } from "./storage";
import { querySchema } from "@shared/schema";
import { parseLogEntry, formatGrafanaResponse } from "./utils/logParser";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  log("Creating API router...");
  const apiRouter = express.Router();

  // Grafana Health Check
  apiRouter.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Search endpoint for variable support
  apiRouter.post('/search', (_req, res) => {
    res.json(['logs']);
  });

  // Main query endpoint
  apiRouter.post('/query', async (req, res) => {
    try {
      log("Received query request");
      const query = querySchema.parse(req.body);
      const from = new Date(query.range.from);
      const to = new Date(query.range.to);

      // Extract filters from adhocFilters
      const filters = query.adhocFilters?.reduce((acc, filter) => {
        acc[filter.key] = filter.value;
        return acc;
      }, {} as Record<string, string>);

      log("Fetching logs from Loki...");
      const logs = await storage.getLogs(from, to, filters);
      const parsedLogs = logs.map(log => parseLogEntry(log));
      log("Successfully fetched and parsed logs");

      res.json(formatGrafanaResponse(parsedLogs));
    } catch (error) {
      console.error('Query error:', error);
      res.status(400).json({ 
        error: 'Query failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Tag keys endpoint for variable support
  apiRouter.post('/tag-keys', (_req, res) => {
    res.json([
      { type: 'string', text: 'Computer' },
      { type: 'string', text: 'Level' },
      { type: 'string', text: 'Channel' },
      { type: 'string', text: 'EventID' },
      { type: 'string', text: 'Source' },
      { type: 'string', text: 'Environment' },
      { type: 'string', text: 'Region' }
    ]);
  });

  // Tag values endpoint for variable support
  apiRouter.post('/tag-values', (req, res) => {
    const key = req.body.key;
    if (key === 'Level') {
      res.json(['error', 'warn', 'info', 'debug', 'trace'].map(v => ({ text: v })));
    } else {
      // For other tags, return empty list as values will come from Loki
      res.json([]);
    }
  });

  log("Mounting API routes...");
  // Mount all API routes under /api
  app.use('/api', apiRouter);

  log("Creating HTTP server...");
  const httpServer = createServer(app);
  return httpServer;
}
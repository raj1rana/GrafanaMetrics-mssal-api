import type { Express } from "express";
import { createServer, type Server } from "http";
import express from 'express';
import { storage } from "./storage";
import { querySchema } from "@shared/schema";
import { parseLogEntry, formatGrafanaResponse } from "./utils/logParser";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();

  // Grafana Health Check
  apiRouter.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Search endpoint for variable support
  apiRouter.post('/search', (_req, res) => {
    res.json(['logs']);
  });

  // Test endpoint to insert sample log
  apiRouter.post('/test/insert-log', async (req, res) => {
    try {
      const rawLog = req.body;
      const parsedLog = parseLogEntry(rawLog);
      const result = await storage.insertLog(parsedLog);
      res.json({ status: 'ok', message: 'Log inserted successfully', log: result });
    } catch (error) {
      console.error('Insert error:', error);
      res.status(400).json({ 
        error: 'Failed to insert log', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Main query endpoint
  apiRouter.post('/query', async (req, res) => {
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
      res.status(400).json({ 
        error: 'Invalid query parameters', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Annotations endpoint
  apiRouter.post('/annotations', (_req, res) => {
    res.json([]);
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
      // For other tags, return empty list for now
      // In a real implementation, this would query the storage for unique values
      res.json([]);
    }
  });

  // Mount all API routes under /api
  app.use('/api', apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
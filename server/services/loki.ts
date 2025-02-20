import axios from 'axios';
import { z } from 'zod';
import type { LogEntry } from '@shared/schema';
import { log } from '../vite';

const LOKI_URL = 'https://loki.ent-observability-na-aws-dev.jnj.com';

// Response schema for Loki query_range
const lokiStreamSchema = z.object({
  stream: z.record(z.string(), z.string()),
  values: z.array(z.tuple([z.string(), z.string()]))
});

const lokiResponseSchema = z.object({
  status: z.string(),
  data: z.object({
    resultType: z.string(),
    result: z.array(lokiStreamSchema)
  })
});

export class LokiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = LOKI_URL;
    log("Initializing Loki service with URL: " + this.baseUrl);
  }

  async queryRange(params: {
    query: string;
    start: number;
    end: number;
    limit?: number;
  }): Promise<LogEntry[]> {
    try {
      // Validate parameters
      if (!params.query) {
        throw new Error('Query string is required');
      }
      if (!params.start || !params.end) {
        throw new Error('Start and end timestamps are required');
      }
      if (params.start > params.end) {
        throw new Error('Start timestamp cannot be greater than end timestamp');
      }

      log(`Querying Loki with params: ${JSON.stringify(params)}`);
      const response = await axios.get(`${this.baseUrl}/loki/api/v1/query_range`, {
        params: {
          query: params.query,
          start: params.start,
          end: params.end,
          limit: params.limit || 1000,
        },
        timeout: 30000, // 30 second timeout
      });

      if (response.status !== 200) {
        throw new Error(`Loki API returned status ${response.status}`);
      }

      log("Received response from Loki, parsing data...");
      const parsed = lokiResponseSchema.parse(response.data);

      return parsed.data.result.flatMap(stream => 
        stream.values.map(([timestamp, message]) => {
          // Parse the message as JSON if possible
          let parsedMessage;
          try {
            parsedMessage = JSON.parse(message);
          } catch {
            parsedMessage = { message };
          }

          // Extract tags from stream labels
          const tags: Record<string, string> = {};
          Object.entries(stream.stream).forEach(([key, value]) => {
            if (typeof value === 'string') {
              tags[key] = value;
            }
          });

          return {
            timestamp: new Date(Number(timestamp) * 1000).toISOString(),
            message: parsedMessage.message || message,
            level: parsedMessage.level || stream.stream.level || 'info',
            eventRecordID: parsedMessage.eventRecordID || `${timestamp}-${stream.stream.filename || ''}`,
            computer: stream.stream.hostname || undefined,
            tags,
            fields: parsedMessage.fields || {}
          };
        })
      );
    } catch (error) {
      console.error('Loki query error:', error);
      throw new Error(`Failed to query Loki: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert Grafana query to Loki query
  convertGrafanaQueryToLoki(filters?: Record<string, string>): string {
    let query = '{job="grafana"}';

    if (filters) {
      const lokiFilters = Object.entries(filters)
        .map(([key, value]) => {
          if (key.startsWith('tags_')) {
            const labelKey = key.replace('tags_', '');
            return `${labelKey}="${value}"`;
          }
          return null;
        })
        .filter(Boolean)
        .join(',');

      if (lokiFilters) {
        query = `{${lokiFilters}}`;
      }
    }

    log(`Converted Grafana query to Loki query: ${query}`);
    return query;
  }
}

export const lokiService = new LokiService();
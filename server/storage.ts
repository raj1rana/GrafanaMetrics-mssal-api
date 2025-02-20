import { type LogEntry, type Log, type InsertLog } from "@shared/schema";
import { lokiService } from "./services/loki";

export interface IStorage {
  getLogs(from: Date, to: Date, filters?: Record<string, string>): Promise<Log[]>;
  insertLog(log: InsertLog): Promise<Log>;
}

export class LokiStorage implements IStorage {
  async getLogs(from: Date, to: Date, filters?: Record<string, string>): Promise<Log[]> {
    const lokiQuery = lokiService.convertGrafanaQueryToLoki(filters);

    const logs = await lokiService.queryRange({
      query: lokiQuery,
      start: Math.floor(from.getTime() / 1000),
      end: Math.floor(to.getTime() / 1000)
    });

    // Convert LogEntry to Log type
    return logs.map((log, index) => ({
      id: index + 1, // Use sequential IDs since Loki doesn't provide them
      timestamp: new Date(log.timestamp),
      message: log.message,
      level: log.level,
      eventRecordID: log.eventRecordID,
      computer: log.computer || null, // Convert undefined to null to match type
      tags: log.tags || null, // Convert undefined to null to match type
      fields: log.fields || null // Convert undefined to null to match type
    }));
  }

  async insertLog(_log: InsertLog): Promise<Log> {
    throw new Error("Direct log insertion not supported when using Loki as backend");
  }
}

export const storage = new LokiStorage();
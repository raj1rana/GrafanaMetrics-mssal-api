import { type LogEntry, type Log, type InsertLog } from "@shared/schema";
import moment from "moment";

export interface IStorage {
  getLogs(from: Date, to: Date, filters?: Record<string, string>): Promise<Log[]>;
  insertLog(log: InsertLog): Promise<Log>;
}

export class MemStorage implements IStorage {
  private logs: Log[];
  private currentId: number;

  constructor() {
    this.logs = [];
    this.currentId = 1;
  }

  async getLogs(from: Date, to: Date, filters?: Record<string, string>): Promise<Log[]> {
    return this.logs.filter(log => {
      const timestamp = moment(log.timestamp);
      const matchesTimeRange = timestamp.isBetween(from, to);
      
      if (!matchesTimeRange) return false;
      
      if (filters) {
        return Object.entries(filters).every(([key, value]) => {
          if (key.startsWith('tags_')) {
            const tagKey = key.replace('tags_', '');
            return log.tags?.[tagKey] === value;
          }
          return true;
        });
      }
      
      return true;
    });
  }

  async insertLog(insertLog: InsertLog): Promise<Log> {
    const id = this.currentId++;
    const log: Log = { 
      ...insertLog,
      id
    };
    this.logs.push(log);
    return log;
  }
}

export const storage = new MemStorage();

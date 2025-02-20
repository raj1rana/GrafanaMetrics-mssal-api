import moment from "moment";
import { type LogEntry } from "@shared/schema";

const LOG_LEVELS = {
  'error': 0,
  'warn': 1, 
  'info': 2,
  'debug': 3,
  'trace': 4
};

export function parseLogEntry(rawLog: any): LogEntry {
  const timestamp = moment(rawLog.timestamp).format();
  
  return {
    timestamp,
    message: rawLog.fields_Message || rawLog.message || '',
    level: mapLogLevel(rawLog.fields_Level || 'info'),
    eventRecordID: rawLog.fields_EventRecordID || String(Date.now()),
    computer: rawLog.tags_Computer,
    tags: extractTags(rawLog),
    fields: extractFields(rawLog)
  };
}

function mapLogLevel(level: string): string {
  const normalized = level.toLowerCase();
  return Object.keys(LOG_LEVELS).find(l => normalized.includes(l)) || 'info';
}

function extractTags(rawLog: any): Record<string, string> {
  return Object.entries(rawLog)
    .filter(([key]) => key.startsWith('tags_'))
    .reduce((acc, [key, value]) => {
      const tagName = key.replace('tags_', '');
      acc[tagName] = String(value);
      return acc;
    }, {} as Record<string, string>);
}

function extractFields(rawLog: any): Record<string, unknown> {
  return Object.entries(rawLog)
    .filter(([key]) => key.startsWith('fields_'))
    .reduce((acc, [key, value]) => {
      const fieldName = key.replace('fields_', '');
      acc[fieldName] = value;
      return acc;
    }, {} as Record<string, unknown>);
}

export function formatGrafanaResponse(logs: LogEntry[]) {
  return [{
    columns: [
      { text: 'Time', type: 'time' },
      { text: 'Message', type: 'string' },
      { text: 'Level', type: 'string' },
      { text: 'EventRecordID', type: 'string' }
    ],
    rows: logs.map(log => [
      log.timestamp,
      log.message,
      log.level,
      log.eventRecordID
    ]),
    type: 'table'
  }];
}

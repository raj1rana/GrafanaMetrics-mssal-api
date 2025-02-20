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
  // Convert Unix timestamp to ISO format
  const timestamp = moment.unix(Number(rawLog.timestamp)).toISOString();

  // Extract message from fields_Data or fields_Message
  const message = rawLog.fields_Data || rawLog.fields_Message || rawLog.message || '';

  // Extract tags and fields
  const tags: Record<string, string> = {};
  const fields: Record<string, unknown> = {};

  // Process all fields in rawLog
  Object.entries(rawLog).forEach(([key, value]) => {
    if (key.startsWith('tags_')) {
      const tagKey = key.replace('tags_', '');
      tags[tagKey] = String(value);
    } else if (key.startsWith('fields_')) {
      const fieldKey = key.replace('fields_', '');
      fields[fieldKey] = value;
    }
  });

  return {
    timestamp,
    message,
    level: mapLogLevel(rawLog.level || rawLog.tags_Level || 'info'),
    eventRecordID: rawLog.fields_EventRecordID || String(Date.now()),
    computer: rawLog.tags_Computer,
    tags,
    fields
  };
}

function mapLogLevel(level: string): string {
  const normalized = level.toLowerCase();
  return Object.keys(LOG_LEVELS).find(l => normalized.includes(l)) || 'info';
}

export function formatGrafanaResponse(logs: LogEntry[]) {
  return [{
    columns: [
      { text: 'Time', type: 'time' },
      { text: 'Message', type: 'string' },
      { text: 'Level', type: 'string' },
      { text: 'EventRecordID', type: 'string' },
      { text: 'Computer', type: 'string' },
      { text: 'Tags', type: 'string' },
      { text: 'Fields', type: 'string' }
    ],
    rows: logs.map(log => [
      log.timestamp,
      log.message,
      log.level,
      log.eventRecordID,
      log.computer,
      JSON.stringify(log.tags),
      JSON.stringify(log.fields)
    ]),
    type: 'table'
  }];
}
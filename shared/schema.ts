import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Grafana Data Source Types
export const logEntrySchema = z.object({
  timestamp: z.string(),
  message: z.string(),
  level: z.string(),
  eventRecordID: z.string(),
  computer: z.string().optional(),
  tags: z.record(z.string(), z.string()).optional(),
  fields: z.record(z.string(), z.unknown()).optional(),
});

export const querySchema = z.object({
  range: z.object({
    from: z.string(),
    to: z.string()
  }),
  intervalMs: z.number(),
  maxDataPoints: z.number(),
  targets: z.array(z.object({
    target: z.string(),
    refId: z.string(),
    type: z.string()
  })),
  adhocFilters: z.array(z.object({
    key: z.string(),
    operator: z.string(),
    value: z.string()
  })).optional()
});

export type LogEntry = z.infer<typeof logEntrySchema>;
export type GrafanaQuery = z.infer<typeof querySchema>;

// Storage schema
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  message: text("message").notNull(),
  level: text("level").notNull(),
  eventRecordID: text("event_record_id").notNull(),
  computer: text("computer"),
  tags: jsonb("tags"),
  fields: jsonb("fields")
});

export const insertLogSchema = createInsertSchema(logs).omit({ 
  id: true 
});

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;

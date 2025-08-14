import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  provider: text("provider"),
  providerId: text("provider_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  preset: text("preset").default("custom").notNull(),
  customInstructions: text("custom_instructions"),
  model: text("model").default("anthropic/claude-3.5-sonnet").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // For additional data like model used, tokens, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const chatPresets = {
  custom: {
    name: "Custom",
    description: "Customize how Forus API responds.",
    systemPrompt: "",
  },
  concise: {
    name: "Concise",
    description: "Responds briefly and directly.",
    systemPrompt: "Be concise and direct in your responses. Provide clear, brief answers without unnecessary elaboration.",
  },
  formal: {
    name: "Formal",
    description: "Responds using a formal tone.",
    systemPrompt: "Respond in a formal, professional manner. Use proper grammar and maintain a respectful, academic tone.",
  },
  socratic: {
    name: "Socratic",
    description: "Responds in a way to help you learn.",
    systemPrompt: "Use the Socratic method to help the user learn. Ask guiding questions and encourage critical thinking rather than providing direct answers.",
  },
} as const;

export type ChatPreset = keyof typeof chatPresets;

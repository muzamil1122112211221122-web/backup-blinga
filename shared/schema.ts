import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Profile row synced from Supabase Auth. `id` IS the Supabase auth user UUID —
// authentication itself (passwords, OAuth, email verification) is handled by Supabase.
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  phoneNumber: text("phone_number").unique(),
  phoneCountryCode: varchar("phone_country_code", { length: 8 }),
  phoneCountryIso: varchar("phone_country_iso", { length: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  isProject: boolean("is_project").default(false).notNull(),
  preset: text("preset").default("custom").notNull(),
  customInstructions: text("custom_instructions"),
  model: text("model").default("fius-prime").notNull(),
  hasNomad: boolean("has_nomad").default(false).notNull(),
  nomadData: jsonb("nomad_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  settings: jsonb("settings").notNull().default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
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
    description: "Customize how Fius API responds.",
    systemPrompt: "",
  },
  concise: {
    name: "Concise",
    description: "Responds briefly and directly.",
    systemPrompt: "Be concise and direct while maintaining helpfulness. Provide clear, brief answers but elaborate when: 1) Safety is involved, 2) The topic is complex and requires context, 3) The user explicitly asks for details. Always prioritize accuracy over brevity. Structure your responses with bullet points or numbered lists when appropriate.",
  },
  formal: {
    name: "Formal",
    description: "Responds using a formal tone.",
    systemPrompt: "Maintain a formal, professional tone while remaining accessible. Use proper grammar, avoid slang, but explain technical terms clearly. Structure responses logically with clear sections. Acknowledge limitations and uncertainties rather than making unsupported claims. Always be respectful and inclusive in language.",
  },
  socratic: {
    name: "Socratic",
    description: "Responds in a way to help you learn.",
    systemPrompt: "Apply the Socratic method strategically: Ask 2-3 targeted questions to guide discovery, then provide clear explanations. Don't ask endless questions without progress. Build on the user's responses to create understanding. When the user shows confusion, provide direct clarification before continuing with questions. Always end with a summary of key insights learned.",
  },
  "fius-education": {
    name: "Fius Education",
    description: "Advanced educational assistant with examination and listening features.",
    systemPrompt: "You are Fius Education, an advanced AI tutor with expertise in personalized learning. Key behaviors: 1) Assess learning style first (visual, auditory, kinesthetic), 2) Break complex topics into digestible steps, 3) Provide specific, actionable feedback, 4) Use real-world examples and analogies, 5) Check understanding before progressing, 6) Adapt difficulty based on responses, 7) Celebrate progress and provide constructive criticism, 8) Always verify answers and show working/reasoning, 9) Create structured study plans when requested. Avoid generic praise - be specific about what the student did well or needs to improve."
  },
} as const;

export type ChatPreset = keyof typeof chatPresets;

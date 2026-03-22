import { type User, type InsertUser, type Conversation, type InsertConversation, type Message, type InsertMessage, users, conversations, messages, emailVerificationTokens, userSettings } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProviderId(providerId: string): Promise<User | undefined>;
  getUsersByNameAndBirthDate(displayName: string, birthDate: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Email verification
  createVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getVerificationToken(token: string): Promise<{ userId: string; expiresAt: Date } | undefined>;
  deleteVerificationToken(token: string): Promise<void>;

  // Conversation operations
  getConversation(id: string): Promise<Conversation | undefined>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<boolean>;

  // Message operations
  getConversationMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: string): Promise<boolean>;

  // Settings operations
  getUserSettings(userId: string): Promise<Record<string, any>>;
  saveUserSettings(userId: string, settings: Record<string, any>): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message> = new Map();
  private verificationTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();
  private settings: Map<string, Record<string, any>> = new Map();

  async getUser(id: string) { return this.users.get(id); }
  async getUserByEmail(email: string) { return Array.from(this.users.values()).find(u => u.email === email); }
  async getUserByProviderId(providerId: string) { return Array.from(this.users.values()).find(u => u.providerId === providerId); }
  async getUsersByNameAndBirthDate(displayName: string, birthDate: string) {
    return Array.from(this.users.values()).filter(u => u.displayName === displayName && u.birthDate === birthDate);
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, password: insertUser.password || null, passwordHash: insertUser.passwordHash || null, emailVerified: false, provider: insertUser.provider || null, providerId: insertUser.providerId || null, displayName: insertUser.displayName || null, birthDate: insertUser.birthDate || null, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id: string, updates: Partial<User>) {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }
  async createVerificationToken(userId: string, token: string, expiresAt: Date) {
    this.verificationTokens.set(token, { userId, expiresAt });
  }
  async getVerificationToken(token: string) { return this.verificationTokens.get(token); }
  async deleteVerificationToken(token: string) { this.verificationTokens.delete(token); }

  async getConversation(id: string) { return this.conversations.get(id); }
  async getUserConversations(userId: string) {
    return Array.from(this.conversations.values()).filter(c => c.userId === userId).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = { ...insertConversation, id, isPrivate: insertConversation.isPrivate ?? false, isProject: insertConversation.isProject ?? false, preset: insertConversation.preset ?? "custom", customInstructions: insertConversation.customInstructions ?? null, model: insertConversation.model ?? "forus-prime", createdAt: now, updatedAt: now };
    this.conversations.set(id, conversation);
    return conversation;
  }
  async updateConversation(id: string, updates: Partial<Conversation>) {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    const updated = { ...conversation, ...updates, updatedAt: new Date() };
    this.conversations.set(id, updated);
    return updated;
  }
  async deleteConversation(id: string) {
    const deleted = this.conversations.delete(id);
    Array.from(this.messages.entries()).filter(([, m]) => m.conversationId === id).forEach(([mid]) => this.messages.delete(mid));
    return deleted;
  }
  async getConversationMessages(conversationId: string) {
    return Array.from(this.messages.values()).filter(m => m.conversationId === conversationId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { ...insertMessage, id, metadata: insertMessage.metadata ?? null, createdAt: new Date() };
    this.messages.set(id, message);
    return message;
  }
  async deleteMessage(id: string) { return this.messages.delete(id); }
  async getUserSettings(userId: string) { return this.settings.get(userId) || {}; }
  async saveUserSettings(userId: string, settings: Record<string, any>) { this.settings.set(userId, settings); }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const d = db();
    if (!d) return undefined;
    const [user] = await d.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const d = db();
    if (!d) return undefined;
    const [user] = await d.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByProviderId(providerId: string): Promise<User | undefined> {
    const d = db();
    if (!d) return undefined;
    const [user] = await d.select().from(users).where(eq(users.providerId, providerId));
    return user || undefined;
  }

  async getUsersByNameAndBirthDate(displayName: string, birthDate: string): Promise<User[]> {
    const d = db();
    if (!d) return [];
    return await d.select().from(users).where(and(eq(users.displayName, displayName), eq(users.birthDate, birthDate)));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const d = db();
    if (!d) throw new Error("No database connection");
    const [user] = await d.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const d = db();
    if (!d) return undefined;
    const [user] = await d.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async createVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    const d = db();
    if (!d) return;
    await d.insert(emailVerificationTokens).values({ userId, token, expiresAt });
  }

  async getVerificationToken(token: string): Promise<{ userId: string; expiresAt: Date } | undefined> {
    const d = db();
    if (!d) return undefined;
    const [row] = await d.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
    if (!row) return undefined;
    return { userId: row.userId, expiresAt: row.expiresAt };
  }

  async deleteVerificationToken(token: string): Promise<void> {
    const d = db();
    if (!d) return;
    await d.delete(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const d = db();
    if (!d) return undefined;
    const [conversation] = await d.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    const d = db();
    if (!d) return [];
    return await d.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(conversations.updatedAt);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const d = db();
    if (!d) throw new Error("No database connection");
    const [conversation] = await d.insert(conversations).values(insertConversation).returning();
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const d = db();
    if (!d) return undefined;
    const [conversation] = await d.update(conversations).set({ ...updates, updatedAt: new Date() }).where(eq(conversations.id, id)).returning();
    return conversation || undefined;
  }

  async deleteConversation(id: string): Promise<boolean> {
    const d = db();
    if (!d) return false;
    await d.delete(messages).where(eq(messages.conversationId, id));
    const result = await d.delete(conversations).where(eq(conversations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const d = db();
    if (!d) return [];
    return await d.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const d = db();
    if (!d) throw new Error("No database connection");
    const [message] = await d.insert(messages).values(insertMessage).returning();
    return message;
  }

  async deleteMessage(id: string): Promise<boolean> {
    const d = db();
    if (!d) return false;
    const result = await d.delete(messages).where(eq(messages.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getUserSettings(userId: string): Promise<Record<string, any>> {
    const d = db();
    if (!d) return {};
    const [row] = await d.select().from(userSettings).where(eq(userSettings.userId, userId));
    return (row?.settings as Record<string, any>) || {};
  }

  async saveUserSettings(userId: string, settings: Record<string, any>): Promise<void> {
    const d = db();
    if (!d) return;
    await d.insert(userSettings).values({ userId, settings }).onConflictDoUpdate({
      target: userSettings.userId,
      set: { settings, updatedAt: new Date() },
    });
  }
}

export const storage = new DatabaseStorage();

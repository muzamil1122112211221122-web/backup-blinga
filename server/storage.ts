import { type User, type InsertUser, type Conversation, type InsertConversation, type Message, type InsertMessage, users, conversations, messages } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByProviderId(providerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.providerId === providerId);
  }

  async getUsersByNameAndBirthDate(displayName: string, birthDate: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.displayName === displayName && user.birthDate === birthDate
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      password: insertUser.password || null,
      provider: insertUser.provider || null,
      providerId: insertUser.providerId || null,
      displayName: insertUser.displayName || null,
      birthDate: insertUser.birthDate || null,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      isPrivate: insertConversation.isPrivate ?? false,
      preset: insertConversation.preset ?? "custom",
      customInstructions: insertConversation.customInstructions ?? null,
      model: insertConversation.model ?? "anthropic/claude-3.5-sonnet",
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;

    const updated: Conversation = {
      ...conversation,
      ...updates,
      updatedAt: new Date(),
    };
    this.conversations.set(id, updated);
    return updated;
  }

  async deleteConversation(id: string): Promise<boolean> {
    const deleted = this.conversations.delete(id);
    // Also delete associated messages
    Array.from(this.messages.entries())
      .filter(([, message]) => message.conversationId === id)
      .forEach(([messageId]) => this.messages.delete(messageId));
    return deleted;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      metadata: insertMessage.metadata ?? null,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async deleteMessage(id: string): Promise<boolean> {
    return this.messages.delete(id);
  }
}

// Fallback memory maps for degraded mode
const fallbackUsers = new Map<string, User>();
const fallbackConversations = new Map<string, Conversation>();
const fallbackMessages = new Map<string, Message>();

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const d = db();
    if (!d) return fallbackUsers.get(id);
    const [user] = await d.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const d = db();
    if (!d) return Array.from(fallbackUsers.values()).find(user => user.email === email);
    const [user] = await d.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByProviderId(providerId: string): Promise<User | undefined> {
    const d = db();
    if (!d) return Array.from(fallbackUsers.values()).find(user => user.providerId === providerId);
    const [user] = await d.select().from(users).where(eq(users.providerId, providerId));
    return user || undefined;
  }

  async getUsersByNameAndBirthDate(displayName: string, birthDate: string): Promise<User[]> {
    const d = db();
    if (!d) return Array.from(fallbackUsers.values()).filter(user => 
      user.displayName === displayName && user.birthDate === birthDate
    );
    return await d
      .select()
      .from(users)
      .where(and(
        eq(users.displayName, displayName),
        eq(users.birthDate, birthDate)
      ));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const d = db();
    if (!d) {
      const id = randomUUID();
      const user = { ...insertUser, id, createdAt: new Date(), password: insertUser.password || null, provider: insertUser.provider || null, providerId: insertUser.providerId || null, displayName: insertUser.displayName || null, birthDate: insertUser.birthDate || null } as User;
      fallbackUsers.set(id, user);
      return user;
    }
    const [user] = await d
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const d = db();
    if (!d) {
      const user = fallbackUsers.get(id);
      if (!user) return undefined;
      const updated = { ...user, ...updates };
      fallbackUsers.set(id, updated);
      return updated;
    }
    const [user] = await d
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const d = db();
    if (!d) return fallbackConversations.get(id);
    const [conversation] = await d.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    const d = db();
    if (!d) return Array.from(fallbackConversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return await d
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(conversations.updatedAt);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const d = db();
    if (!d) {
      const id = randomUUID();
      const now = new Date();
      const conversation = { 
        ...insertConversation, 
        id, 
        createdAt: now, 
        updatedAt: now,
        isPrivate: insertConversation.isPrivate ?? false,
        preset: insertConversation.preset ?? "custom",
        customInstructions: insertConversation.customInstructions ?? null,
        model: insertConversation.model ?? "anthropic/claude-3.5-sonnet"
      } as Conversation;
      fallbackConversations.set(id, conversation);
      return conversation;
    }
    const [conversation] = await d
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const d = db();
    if (!d) {
      const conversation = fallbackConversations.get(id);
      if (!conversation) return undefined;
      const updated = { ...conversation, ...updates, updatedAt: new Date() };
      fallbackConversations.set(id, updated);
      return updated;
    }
    const [conversation] = await d
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async deleteConversation(id: string): Promise<boolean> {
    const d = db();
    if (!d) {
      const deleted = fallbackConversations.delete(id);
      Array.from(fallbackMessages.values())
        .filter(msg => msg.conversationId === id)
        .forEach(msg => fallbackMessages.delete(msg.id));
      return deleted;
    }
    // Delete messages first
    await d.delete(messages).where(eq(messages.conversationId, id));
    // Delete conversation
    const result = await d.delete(conversations).where(eq(conversations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const d = db();
    if (!d) return Array.from(fallbackMessages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return await d
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const d = db();
    if (!d) {
      const id = randomUUID();
      const message = { 
        ...insertMessage, 
        id, 
        createdAt: new Date(),
        metadata: insertMessage.metadata ?? null
      } as Message;
      fallbackMessages.set(id, message);
      return message;
    }
    const [message] = await d
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async deleteMessage(id: string): Promise<boolean> {
    const d = db();
    if (!d) return fallbackMessages.delete(id);
    const result = await d.delete(messages).where(eq(messages.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();

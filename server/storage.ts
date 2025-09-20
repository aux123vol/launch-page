import {
  users,
  missionSignups,
  type User,
  type UpsertUser,
  type InsertMissionSignup,
  type MissionSignup,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Mission signup operations
  createMissionSignup(signup: InsertMissionSignup): Promise<MissionSignup>;
  getMissionSignupByEmail(email: string): Promise<MissionSignup | undefined>;
  getMissionSignupCount(): Promise<number>;
  getAllMissionSignups(): Promise<MissionSignup[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Mission signup operations
  async createMissionSignup(signupData: InsertMissionSignup): Promise<MissionSignup> {
    const [signup] = await db
      .insert(missionSignups)
      .values(signupData)
      .returning();
    return signup;
  }

  async getMissionSignupByEmail(email: string): Promise<MissionSignup | undefined> {
    const [signup] = await db
      .select()
      .from(missionSignups)
      .where(eq(missionSignups.email, email));
    return signup;
  }

  async getMissionSignupCount(): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(missionSignups);
    return Number(result[0]?.count || 0);
  }

  async getAllMissionSignups(): Promise<MissionSignup[]> {
    return await db
      .select()
      .from(missionSignups)
      .orderBy(desc(missionSignups.createdAt));
  }
}

export const storage = new DatabaseStorage();
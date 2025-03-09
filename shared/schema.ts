import { text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { projectSchema } from "./projectSchema";

// Common schemas used by both frontend and backend
export const snippetSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  content: z.string(),
  language: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()),
  folderId: z.string().optional(),
  projectId: z.string().optional(),
  userId: z.string(),
  createdAt: z.number(),
  updatedAt: z.number()
});


export const folderSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  userId: z.string(),
  createdAt: z.number()
});

export const tagSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  userId: z.string()
});

export type Snippet = z.infer<typeof snippetSchema>;
export type Folder = z.infer<typeof folderSchema>;
export type Tag = z.infer<typeof tagSchema>;
export type Project = z.infer<typeof projectSchema>;

// Re-export project schema
export { projectSchema } from "./projectSchema";
import { z } from "zod";

// Project schema definition
export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  userId: z.string(),
  createdAt: z.number(),
  updatedAt: z.number()
});

export type Project = z.infer<typeof projectSchema>;
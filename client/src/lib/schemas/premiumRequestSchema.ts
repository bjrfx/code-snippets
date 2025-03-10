// Schema for premium feature requests
import { z } from 'zod';

// Status types for premium feature requests
export type RequestStatus = 'pending' | 'approved' | 'rejected';

// Schema for premium feature requests
export const premiumRequestSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  userEmail: z.string().email(),
  userName: z.string().optional(),
  requestedFeature: z.string(),
  requestMessage: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
  reviewedBy: z.string().optional(),
  reviewNotes: z.string().optional(),
  // For approved requests
  approvalStartDate: z.number().optional(),
  approvalEndDate: z.number().optional(),
  // Duration in days (if admin sets days instead of specific end date)
  approvalDuration: z.number().optional(),
});

// Type for premium feature requests
export type PremiumRequest = z.infer<typeof premiumRequestSchema>;
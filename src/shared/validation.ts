import { z } from 'zod';

export const varcharSchema = z
  .string()
  .min(1)
  .max(255);
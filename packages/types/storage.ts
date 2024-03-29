import { z } from "zod";

export const ZAccessType = z.enum(["public", "private"]);

export const ZStorageRetrievalParams = z.object({
  fileName: z.string(),
  environmentId: z.string().cuid(),
  accessType: ZAccessType,
});

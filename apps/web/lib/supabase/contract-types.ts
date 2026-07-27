/** أنواع مشتقة من عقود @bayti/contracts (Zod schemas — قيم لا أنواع، تُشتق عبر z.infer) */
import type { z } from "zod";
import {
  UploadIntentInput as UploadIntentInputSchema,
  UploadIntentOutput as UploadIntentOutputSchema,
  UploadCompleteInput as UploadCompleteInputSchema,
  UploadCompleteOutput as UploadCompleteOutputSchema,
} from "@bayti/contracts";

export type UploadIntentInput = z.infer<typeof UploadIntentInputSchema>;
export type UploadIntentOutput = z.infer<typeof UploadIntentOutputSchema>;
export type UploadCompleteInput = z.infer<typeof UploadCompleteInputSchema>;
export type UploadCompleteOutput = z.infer<typeof UploadCompleteOutputSchema>;

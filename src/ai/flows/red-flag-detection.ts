'use server';

/**
 * @fileOverview This file defines a Genkit flow for detecting potential red flags in startup documents.
 *
 * - `detectRedFlags`:  A function that takes document text as input and returns a list of potential red flags.
 * - `RedFlagDetectionInput`: The input type for the `detectRedFlags` function.
 * - `RedFlagDetectionOutput`: The output type for the `detectRedFlags` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RedFlagDetectionInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content of the startup document to analyze.'),
});
export type RedFlagDetectionInput = z.infer<typeof RedFlagDetectionInputSchema>;

const RedFlagDetectionOutputSchema = z.object({
  redFlags: z
    .array(z.string())
    .describe('A list of potential red flags identified in the document.'),
});
export type RedFlagDetectionOutput = z.infer<typeof RedFlagDetectionOutputSchema>;

export async function detectRedFlags(
  input: RedFlagDetectionInput
): Promise<RedFlagDetectionOutput> {
  return detectRedFlagsFlow(input);
}

const detectRedFlagsPrompt = ai.definePrompt({
  name: 'detectRedFlagsPrompt',
  input: {schema: RedFlagDetectionInputSchema},
  output: {schema: RedFlagDetectionOutputSchema},
  prompt: `You are an expert risk assessment analyst reviewing startup documents for potential red flags. Red flags are defined as key risk factors or common fraud triggers.

  Analyze the following document text and identify any red flags. Provide a list of specific red flags that you found. Be concise and specific.

  Document Text: {{{documentText}}}`,
});

const detectRedFlagsFlow = ai.defineFlow(
  {
    name: 'detectRedFlagsFlow',
    inputSchema: RedFlagDetectionInputSchema,
    outputSchema: RedFlagDetectionOutputSchema,
  },
  async input => {
    const {output} = await detectRedFlagsPrompt(input);
    return output!;
  }
);

'use server';
/**
 * @fileOverview Flow to generate a summary for an event transcript.
 *
 * - generateSummary - A function that handles the event summary process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// No specific input/output schemas needed for this simple case,
// but it's good practice to define them for more complex flows.

export async function generateSummary(transcript: string): Promise<string> {
  return eventSummarizerFlow(transcript);
}

const eventSummarizerFlow = ai.defineFlow(
  {
    name: 'eventSummarizerFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (transcript) => {
    const prompt = `You are an expert event summarizer. Based on the following transcript, provide a concise and engaging summary. 
    Focus on the key topics, main conclusions, and overall sentiment. The summary should be suitable for public display on an event platform.

    Transcript:
    ---
    ${transcript}
    ---
    
    Summary:`;
    
    const {output} = await ai.generate({
      prompt: prompt,
    });
    
    return output!;
  }
);

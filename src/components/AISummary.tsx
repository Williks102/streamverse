"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateSummary } from '@/ai/flows/eventSummarizer'; 

interface AISummaryProps {
  eventId: string;
  eventTitle: string;
  transcript?: string;
}

export default function AISummary({ eventId, eventTitle, transcript }: AISummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    if (!transcript) {
      setError("No transcript available for this event to generate a summary.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSummary(null);
    try {
      const generated = await generateSummary(transcript);
      setSummary(generated);
    } catch (err) {
      console.error("Error generating summary:", err);
      setError("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="text-primary" /> AI Event Summary
        </CardTitle>
        <CardDescription>Summary for: {eventTitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summary && !isLoading && (
          <Button onClick={handleGenerateSummary} disabled={!transcript || isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Summary'
            )}
          </Button>
        )}
        
        {isLoading && (
          <div className="flex items-center justify-center p-6 text-muted-foreground">
            <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
            <p>Generating summary, please wait...</p>
          </div>
        )}

        {error && (
           <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!transcript && !isLoading && !error && (
            <Alert variant="default">
                <AlertTitle>Transcript Unavailable</AlertTitle>
                <AlertDescription>A transcript is required to generate a summary for this event. Currently, no transcript is available.</AlertDescription>
            </Alert>
        )}

        {summary && !isLoading && (
          <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/50 rounded-md">
            <h3 className="font-semibold text-lg mb-2 text-foreground">Summary:</h3>
            <p className="whitespace-pre-line text-foreground">{summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

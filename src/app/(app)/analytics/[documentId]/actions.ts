'use server';

export type GenerateViewerEngagementInsightsOutput = {
  summary: string;
  highlyEngagedViewers: {
    email: string;
    engagementScore: number;
    reasoning: string;
  }[];
};

export async function getEngagementInsights(
  documentName: string
): Promise<{
  success: boolean;
  data?: GenerateViewerEngagementInsightsOutput;
  error?: string;
}> {
  // Stub - wire up your AI provider here when ready
  return {
    success: true,
    data: {
      summary: `No AI insights configured yet for "${documentName}".`,
      highlyEngagedViewers: [],
    },
  };
}
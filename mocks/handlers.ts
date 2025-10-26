import { http, HttpResponse } from "msw";

/**
 * MSW Handlers for mocking external API calls during tests
 * Covers OpenAI API and Supabase client interactions
 */

interface ChatMessage {
  content?: string;
}

interface ChatCompletionRequest {
  messages?: ChatMessage[];
}

export const handlers = [
  // Mock OpenAI Chat Completions (GPT-4o for coaching)
  http.post("https://api.openai.com/v1/chat/completions", async ({ request }) => {
    const body = (await request.json()) as ChatCompletionRequest;

    // Return different responses based on the prompt content
    const isCoaching = body.messages?.some(
      (m) => m.content?.includes("STAR") || m.content?.includes("coaching")
    );

    if (isCoaching) {
      return HttpResponse.json({
        id: "chatcmpl-test",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-4o",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({
                star_scores: {
                  situation: 4,
                  task: 4,
                  action: 5,
                  result: 3,
                },
                specificity_tag: "specific",
                impact_tag: "high_impact",
                clarity_tag: "clear",
                honesty_flag: false,
                narrative:
                  "Great example of leadership and problem-solving. You clearly explained the situation and your actions.",
                example_answer:
                  "In my role as Team Lead at [company], I faced [specific situation]. My responsibility was to [specific task]. I took the following steps: [specific actions]. As a result, [specific measurable outcome].",
              }),
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 250,
          completion_tokens: 150,
          total_tokens: 400,
        },
      });
    }

    // Default mock response
    return HttpResponse.json({
      id: "chatcmpl-test",
      object: "chat.completion",
      created: Date.now(),
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Mock response",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    });
  }),

  // Mock OpenAI Whisper Transcription
  http.post("https://api.openai.com/v1/audio/transcriptions", async () => {
    return HttpResponse.json({
      text: "This is a mock transcription of the audio recording.",
    });
  }),

  // Mock ClamAV virus scanner
  http.post("http://localhost:3310/scan", async () => {
    return HttpResponse.json({
      result: "clean",
      message: "No virus detected",
    });
  }),
];

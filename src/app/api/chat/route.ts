import { Message } from 'ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

// Instantiate clients potentially without keys initially
// Keys will be checked within the POST handler based on the provider
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '', // Provide default empty string
});

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '', // Provide default empty string
});

export async function POST(req: Request) {
    try {
        const { messages, modelProvider } = await req.json();

        // Validate provider
        if (!['openai', 'anthropic'].includes(modelProvider)) {
            return new Response('Invalid model provider specified. Use \'openai\' or \'anthropic\'.', { status: 400 });
        }

        // --- OpenAI ---
        if (modelProvider === 'openai') {
            if (!process.env.OPENAI_API_KEY) {
                return new Response('Missing OPENAI_API_KEY environment variable', { status: 500 });
            }
            // Initialize client here if key exists
            const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const response = await openaiClient.chat.completions.create({ // Use the locally scoped client
                model: 'gpt-4o', // Or your preferred OpenAI model
                stream: true,
                messages,
            });

            // Create a native web Response with the appropriate headers
            return new Response(response.toReadableStream(), {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                },
            });
        }

        // --- Anthropic ---
        if (modelProvider === 'anthropic') {
            if (!process.env.ANTHROPIC_API_KEY) {
                return new Response('Missing ANTHROPIC_API_KEY environment variable', { status: 500 });
            }
            // Initialize client here if key exists
            const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
            const response = await anthropicClient.messages.create({ // Use the locally scoped client
                model: 'claude-3-opus-20240229', // Or your preferred Anthropic model
                stream: true,
                max_tokens: 1024,
                messages: messages as Anthropic.MessageParam[], // Adjust type if necessary
            });

            // Adapt Anthropic stream to a standard Web ReadableStream
            const stream = new ReadableStream({
                async start(controller) {
                    for await (const chunk of response) {
                        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                            // Create a properly formatted SSE message
                            const message = `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`;
                            controller.enqueue(new TextEncoder().encode(message));
                        }
                    }
                    // Send a done message and close
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                },
            });

            // Return a native web Response with the appropriate headers
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                },
            });
        }

        // Should not reach here if validation works, but acts as a fallback
        return new Response('Model provider logic fell through unexpectedly.', { status: 500 });

    } catch (error: any) {
        console.error('Error in chat API route:', error);
        const errorMessage = error.message || 'An unexpected error occurred';
        const errorCode = error.status || 500;
        return new Response(JSON.stringify({ error: errorMessage }), { status: errorCode });
    }
}

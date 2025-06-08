import Anthropic from '@anthropic-ai/sdk';

export interface AIResponse {
    content: string;
    isComplete: boolean;
}

export class ClaudeService {
    private client: Anthropic;

    constructor(apiKey: string) {
        this.client = new Anthropic({
            apiKey,
            dangerouslyAllowBrowser: true
        });
    }

    async *streamAnalyzeCode(
        code: string,
        language: string,
        userMessage: string,
        fileName?: string
    ): AsyncGenerator<string, void, unknown> {
        const systemPrompt = this.buildSystemPrompt(language, code, fileName);

        try {
            const stream = await this.client.messages.create({
                model: "claude-sonnet-4-20250514", // Latest Claude model
                max_tokens: 4000,
                system: systemPrompt,
                messages: [
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                stream: true
            });

            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' &&
                    chunk.delta.type === 'text_delta') {
                    yield chunk.delta.text;
                }
            }
        } catch (error: any) {
            console.error('Claude API error:', error);
            throw new Error(`Claude API error: ${error.message}`);
        }
    }

    async analyzeCode(
        code: string,
        language: string,
        userMessage: string,
        fileName?: string
    ): Promise<string> {
        const systemPrompt = this.buildSystemPrompt(language, code, fileName);

        try {
            const response = await this.client.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4000,
                system: systemPrompt,
                messages: [
                    {
                        role: "user",
                        content: userMessage
                    }
                ]
            });

            // Extract text content from response
            const textContent = response.content
                .filter(block => block.type === 'text')
                .map((block: any) => block.text)
                .join('');

            return textContent;
        } catch (error: any) {
            console.error('Claude API error:', error);
            throw new Error(`Claude API error: ${error.message}`);
        }
    }

    private buildSystemPrompt(language: string, code: string, fileName?: string): string {
        const fileInfo = fileName ? `File: ${fileName}` : '';

        return `You are an expert code assistant specializing in ${language} development. You provide helpful, accurate, and actionable advice about code.

${fileInfo}
Current ${language} code context:
\`\`\`${language}
${code}
\`\`\`

Guidelines:
- Provide clear, concise explanations
- Focus on best practices and code quality
- Suggest specific improvements when relevant
- Be encouraging and helpful
- If the code is empty or minimal, offer to help with starting the implementation
- For debugging requests, provide step-by-step analysis
- For optimization requests, focus on performance and maintainability

Respond in a conversational, helpful tone as if you're pair programming with the user.`;
    }

    // Quick action methods for common tasks
    async explainCode(code: string, language: string, fileName?: string): Promise<string> {
        return this.analyzeCode(
            code,
            language,
            "Please explain what this code does, how it works, and highlight any interesting patterns or potential improvements.",
            fileName
        );
    }

    async findBugs(code: string, language: string, fileName?: string): Promise<string> {
        return this.analyzeCode(
            code,
            language,
            "Please review this code for potential bugs, errors, or issues. Look for logic errors, edge cases, performance problems, and security vulnerabilities.",
            fileName
        );
    }

    async optimizeCode(code: string, language: string, fileName?: string): Promise<string> {
        return this.analyzeCode(
            code,
            language,
            "Please analyze this code for optimization opportunities. Focus on performance improvements, code clarity, maintainability, and best practices.",
            fileName
        );
    }

    async generateCode(prompt: string, language: string, context?: string): Promise<string> {
        const systemPrompt = `You are an expert ${language} developer. Generate clean, well-commented, production-ready code.

${context ? `Context: ${context}` : ''}

Guidelines:
- Write clear, readable code with appropriate comments
- Follow ${language} best practices and conventions
- Include error handling where appropriate
- Make the code modular and maintainable
- Add type annotations if applicable (TypeScript, etc.)`;

        try {
            const response = await this.client.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4000,
                system: systemPrompt,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

            const textContent = response.content
                .filter(block => block.type === 'text')
                .map((block: any) => block.text)
                .join('');

            return textContent;
        } catch (error: any) {
            console.error('Claude API error:', error);
            throw new Error(`Claude API error: ${error.message}`);
        }
    }

    // Test connection method
    async testConnection(): Promise<boolean> {
        try {
            await this.client.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 10,
                messages: [
                    {
                        role: "user",
                        content: "Hello"
                    }
                ]
            });
            return true;
        } catch (error) {
            console.error('Claude connection test failed:', error);
            return false;
        }
    }
}
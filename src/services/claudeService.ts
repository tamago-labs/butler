import Anthropic from '@anthropic-ai/sdk';
import { mcpService, MCPTool } from './mcpService';

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
        const tools = this.getMCPTools();

        try {
            const stream = await this.client.messages.create({
                model: "claude-sonnet-4-20250514", // Latest Claude model
                max_tokens: 4000,
                system: systemPrompt,
                tools: tools.length > 0 ? tools : undefined,
                messages: [
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                stream: true
            });

            let pendingToolUse: any = null;
            let pendingContent = '';

            for await (const chunk of stream) {
                if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
                    pendingToolUse = chunk.content_block;
                } else if (chunk.type === 'content_block_delta') {
                    if (chunk.delta.type === 'text_delta') {
                        yield chunk.delta.text;
                    } else if (chunk.delta.type === 'input_json_delta' && pendingToolUse) {
                        pendingContent += chunk.delta.partial_json;
                    }
                } else if (chunk.type === 'content_block_stop' && pendingToolUse) {
                    // Execute the tool call
                    try {
                        const toolInput = JSON.parse(pendingContent);
                        const result = await this.executeMCPTool(pendingToolUse.name, toolInput);
                        yield `\n\n[Tool Result: ${pendingToolUse.name}]\n${result}\n\n`;
                    } catch (toolError) {
                        yield `\n\n[Tool Error: ${pendingToolUse.name}] ${toolError}\n\n`;
                    }
                    pendingToolUse = null;
                    pendingContent = '';
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
        const tools = this.getMCPTools();

        try {
            const response = await this.client.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4000,
                system: systemPrompt,
                tools: tools.length > 0 ? tools : undefined,
                messages: [
                    {
                        role: "user",
                        content: userMessage
                    }
                ]
            });

            let result = '';

            // Process response content and handle tool calls
            for (const block of response.content) {
                if (block.type === 'text') {
                    result += block.text;
                } else if (block.type === 'tool_use') {
                    try {
                        const toolResult = await this.executeMCPTool(block.name, block.input);
                        result += `\n\n[Tool Result: ${block.name}]\n${toolResult}\n\n`;
                    } catch (toolError) {
                        result += `\n\n[Tool Error: ${block.name}] ${toolError}\n\n`;
                    }
                }
            }

            return result;
        } catch (error: any) {
            console.error('Claude API error:', error);
            throw new Error(`Claude API error: ${error.message}`);
        }
    }

    private buildSystemPrompt(language: string, code: string, fileName?: string): string {
        const fileInfo = fileName ? `File: ${fileName}` : '';
        const availableTools = this.getMCPToolDescriptions();
        const hasTools = mcpService.getAvailableTools().length > 0;

        return `You are an expert code assistant specializing in ${language} development. You provide helpful, accurate, and actionable advice about code. ${hasTools ? 'You have access to MCP (Model Context Protocol) tools that can help you interact with files, directories, and other systems.' : ''}

${fileInfo}
Current ${language} code context:
\`\`\`${language}
${code}
\`\`\`

${hasTools ? `Available Tools:
${availableTools}

IMPORTANT: You MUST use the available tools when users ask about files, directories, or project structure. Always prefer using tools over making assumptions.

When listing files or directories:
- Use "." or current workspace path for the current directory
- Use specific paths when users mention them
- If no path specified, assume they mean the current workspace

` : ''}Guidelines:
- Provide clear, concise explanations
- Focus on best practices and code quality
- Suggest specific improvements when relevant
${hasTools ? '- ALWAYS use available tools when users ask about files, directories, or project exploration' : ''}
- Be encouraging and helpful
- If the code is empty or minimal, offer to help with starting the implementation
- For debugging requests, provide step-by-step analysis
- For optimization requests, focus on performance and maintainability
${hasTools ? '- When users ask about files or directories, IMMEDIATELY use the filesystem tools to provide accurate information' : ''}

${hasTools ? `You can use tools to:
- Read file contents with read_file
- List directory contents with list_directory (use "." for current directory)
- Write files with write_file
- Get git status and other repository information
- And more depending on available MCP servers

When a user asks about listing files or exploring directories, you MUST use the list_directory tool with "." for current directory.
` : ''}
Respond in a conversational, helpful tone as if you're pair programming with the user.`;
    }

    // Quick action methods for common tasks
    async explainCode(code: string, language: string, fileName?: string): Promise<string> {
        return this.analyzeCode(
            code,
            language,
            "Please explain what this code does, how it works, and highlight any interesting patterns or potential improvements. If this file is part of a larger project, you can use the filesystem tools to explore related files for better context.",
            fileName
        );
    }

    async findBugs(code: string, language: string, fileName?: string): Promise<string> {
        return this.analyzeCode(
            code,
            language,
            "Please review this code for potential bugs, errors, or issues. Look for logic errors, edge cases, performance problems, and security vulnerabilities. You can use filesystem tools to check related files if needed for context.",
            fileName
        );
    }

    async optimizeCode(code: string, language: string, fileName?: string): Promise<string> {
        return this.analyzeCode(
            code,
            language,
            "Please analyze this code for optimization opportunities. Focus on performance improvements, code clarity, maintainability, and best practices. Use filesystem tools to understand the project structure if it would help with optimization suggestions.",
            fileName
        );
    }

    async generateCode(prompt: string, language: string, context?: string): Promise<string> {
        const tools = this.getMCPTools();
        const systemPrompt = `You are an expert ${language} developer. Generate clean, well-commented, production-ready code.

${context ? `Context: ${context}` : ''}

You have access to MCP tools for file system operations if needed to understand the project structure or read existing files.

Guidelines:
- Write clear, readable code with appropriate comments
- Follow ${language} best practices and conventions
- Include error handling where appropriate
- Make the code modular and maintainable
- Add type annotations if applicable (TypeScript, etc.)
- Use available tools to understand project context if helpful`;

        try {
            const response = await this.client.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4000,
                system: systemPrompt,
                tools: tools.length > 0 ? tools : undefined,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

            let result = '';

            // Process response content and handle tool calls
            for (const block of response.content) {
                if (block.type === 'text') {
                    result += block.text;
                } else if (block.type === 'tool_use') {
                    try {
                        const toolResult = await this.executeMCPTool(block.name, block.input);
                        result += `\n\n[Tool Result: ${block.name}]\n${toolResult}\n\n`;
                    } catch (toolError) {
                        result += `\n\n[Tool Error: ${block.name}] ${toolError}\n\n`;
                    }
                }
            }

            return result;
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

    // MCP Tool Integration
    private getMCPTools(): any[] {
        const availableTools = mcpService.getAvailableTools();
        const tools: any[] = [];

        console.log('Available MCP tools:', availableTools);

        for (const serverTools of availableTools) {
            for (const tool of serverTools.tools) {
                tools.push({
                    name: `${serverTools.serverName}_${tool.name}`,
                    description: `[${serverTools.serverName}] ${tool.description}`,
                    input_schema: tool.inputSchema
                });
            }
        }

        console.log('Formatted tools for Claude:', tools);
        return tools;
    }

    private getMCPToolDescriptions(): string {
        const availableTools = mcpService.getAvailableTools();
        console.log('getMCPToolDescriptions - available tools:', availableTools);
        
        if (availableTools.length === 0) {
            return 'No MCP tools currently available. Please start MCP servers in the MCP tab for filesystem operations.';
        }

        const descriptions: string[] = [];
        for (const serverTools of availableTools) {
            descriptions.push(`${serverTools.serverName}: ${serverTools.tools.map(t => `${t.name} - ${t.description}`).join(', ')}`);
        }

        return descriptions.join('\n');
    }

    private async executeMCPTool(toolName: string, input: any): Promise<string> {
        console.log('Executing MCP tool:', toolName, 'with input:', input);
        
        // Parse server name and tool name from the tool name
        const parts = toolName.split('_');
        if (parts.length < 2) {
            throw new Error('Invalid tool name format');
        }

        const serverName = parts[0];
        const actualToolName = parts.slice(1).join('_');

        try {
            const result = await mcpService.callTool(serverName, actualToolName, input);
            
            // Extract text content from the result
            if (result && result.content) {
                const textContent = result.content
                    .filter((item: any) => item.type === 'text')
                    .map((item: any) => item.text)
                    .join('\n');
                return textContent || 'Tool executed successfully';
            }
            
            return JSON.stringify(result, null, 2);
        } catch (error) {
            console.error(`Failed to execute MCP tool ${toolName}:`, error);
            throw new Error(`Failed to execute tool: ${error}`);
        }
    }
}

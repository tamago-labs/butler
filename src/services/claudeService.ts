import Anthropic from '@anthropic-ai/sdk';
import { mcpService } from './mcpService';

export interface AIResponse {
    content: string;
    isComplete: boolean;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export class ClaudeService {
    private client: Anthropic;

    constructor(apiKey: string) {
        this.client = new Anthropic({
            apiKey,
            dangerouslyAllowBrowser: true
        });
    }

    async *streamChatWithHistory(
        chatHistory: ChatMessage[],
        currentMessage: string
    ): AsyncGenerator<string, void, unknown> {
        const systemPrompt = this.buildSystemPrompt();
        const tools = this.getMCPTools();
        const messages = this.buildConversationMessages(chatHistory, currentMessage);

        console.log('Claude Service: Starting stream with conversation history:', messages.length, 'messages');

        try {
            const stream = await this.client.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4000,
                system: systemPrompt,
                tools: tools.length > 0 ? tools : undefined,
                messages: messages,
                stream: true
            });

            let pendingToolUse: any = null;
            let pendingContent = '';

            for await (const chunk of stream) {
                if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
                    pendingToolUse = chunk.content_block;
                    console.log('Claude Service: Tool use started:', pendingToolUse.name);
                } else if (chunk.type === 'content_block_delta') {
                    if (chunk.delta.type === 'text_delta') {
                        yield chunk.delta.text;
                    } else if (chunk.delta.type === 'input_json_delta' && pendingToolUse) {
                        pendingContent += chunk.delta.partial_json;
                    }
                } else if (chunk.type === 'content_block_stop' && pendingToolUse) {
                    // Execute the tool call
                    try {
                        console.log('Claude Service: Executing tool with content:', pendingContent);
                        const toolInput = JSON.parse(pendingContent);
                        const result = await this.executeMCPTool(pendingToolUse.name, toolInput);
                        yield `\n\n**🔧 Tool Result: ${pendingToolUse.name}**\n${result}\n\n`;
                    } catch (toolError) {
                        console.error('Claude Service: Tool execution failed:', toolError);
                        yield `\n\n**❌ Tool Error: ${pendingToolUse.name}**\n${toolError}\n\n`;
                    }
                    pendingToolUse = null;
                    pendingContent = '';
                }
            }
        } catch (error: any) {
            console.error('Claude Service: API error:', error);
            throw new Error(`Claude API error: ${error.message}`);
        }
    }

    private buildConversationMessages(chatHistory: ChatMessage[], currentMessage: string): any[] {
        const messages: any[] = [];

        // Add previous conversation history (excluding the current message)
        for (const msg of chatHistory) {
            messages.push({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.content
            });
        }

        // Add current message
        messages.push({
            role: 'user',
            content: currentMessage
        });

        // Claude API has limits, so keep only recent messages if too many
        const MAX_MESSAGES = 25; // Adjust based on your needs
        if (messages.length > MAX_MESSAGES) {
            // Keep the most recent messages
            return messages.slice(-MAX_MESSAGES);
        }

        return messages;
    }
  
    private buildSystemPrompt(): string {
        return `You are a helpful coding assistant. 
      Act like a pair programmer: explain clearly, suggest improvements, and help debug or write code as needed.
      
      Guidelines:
      - Be concise and actionable
      - Prioritize readability and best practices
      - Offer step-by-step help when debugging
      - If the user has little or no code, suggest how to start
      - Maintain a friendly, collaborative tone`;
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

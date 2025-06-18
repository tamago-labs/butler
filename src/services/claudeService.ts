import Anthropic from '@anthropic-ai/sdk';
import { mcpService } from './mcpService';
import { Logger } from '../components/LogsPanel';

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
    private logger = Logger.getInstance();

    constructor(apiKey: string) {
        this.client = new Anthropic({
            apiKey,
            dangerouslyAllowBrowser: true
        });
        this.logger.info('claude', 'Claude service initialized');
    }

    async *streamChatWithHistory(
        chatHistory: ChatMessage[],
        currentMessage: string
    ): AsyncGenerator<string, { stopReason?: string }, unknown> {
        const systemPrompt = this.buildSystemPrompt();
        const tools = this.getMCPTools();
        const messages = this.buildConversationMessages(chatHistory, currentMessage);

        console.log('Claude Service: Starting stream with', messages.length, 'messages and', tools.length, 'MCP tools');

        let finalStopReason: string | undefined;

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
            let isCollectingToolInput = false;

            for await (const chunk of stream) {
                if (chunk.type === 'message_delta' && chunk.delta.stop_reason) {
                    finalStopReason = chunk.delta.stop_reason;
                    this.logger.info('claude', `Stream ended with stop_reason: ${finalStopReason}. Type "continue" if you wish to proceed.`);
                } else if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
                    pendingToolUse = chunk.content_block;
                    pendingContent = '';
                    isCollectingToolInput = true;
                    this.logger.info('claude', `Tool use started: ${pendingToolUse.name}`);
                } else if (chunk.type === 'content_block_delta') {
                    if (chunk.delta.type === 'text_delta') {
                        yield chunk.delta.text;
                    } else if (chunk.delta.type === 'input_json_delta' && pendingToolUse && isCollectingToolInput) {
                        pendingContent += chunk.delta.partial_json;
                        this.logger.debug('claude', `Accumulating tool input: ${pendingContent.slice(-50)}...`);
                    }
                } else if (chunk.type === 'content_block_stop' && pendingToolUse && isCollectingToolInput) {
                    // Execute the tool call
                    try {
                        this.logger.info('claude', `Executing tool with final content: ${pendingContent}`);

                        // Parse the accumulated JSON input
                        let toolInput = {};
                        if (pendingContent.trim()) {
                            try {
                                toolInput = JSON.parse(pendingContent);
                            } catch (parseError) {
                                this.logger.error('claude', `Failed to parse tool input JSON: ${parseError}`, { content: pendingContent });
                                yield `\n\n**❌ Tool Error: ${pendingToolUse.name}**\nFailed to parse tool arguments: ${parseError}\n\n`;
                                continue;
                            }
                        }

                        const result = await this.executeMCPTool(pendingToolUse.name, toolInput);
                        this.logger.info('claude', `Tool executed successfully: ${pendingToolUse.name}`);
                        yield `\n\n**🔧 Tool Result: ${pendingToolUse.name}**\n${result}\n\n`;
                    } catch (toolError) {
                        this.logger.error('claude', `Tool execution failed: ${pendingToolUse.name}`, { error: toolError.message });
                        yield `\n\n**❌ Tool Error: ${pendingToolUse.name}**\n${toolError}\n\n`;
                    } finally {
                        pendingToolUse = null;
                        pendingContent = '';
                        isCollectingToolInput = false;
                    }
                }
            }
        } catch (error: any) {
            console.error('Claude Service: API error:', error);
            throw new Error(`Claude API error: ${error.message}`);
        }
        
        return { stopReason: finalStopReason };
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
        const workspaceRoot = mcpService.getWorkspaceRoot();
        const availableTools = mcpService.getAvailableTools();
        
        const folderInfo = workspaceRoot
            ? `\n\nCurrent folder: ${workspaceRoot}`
            : '\n\nNo folder open. Ask user to open a folder first.';
            
        const toolsInfo = availableTools.length > 0 
            ? `\nAvailable tools: ${availableTools.map(st => st.tools.map(t => t.name).join(', ')).join(', ')}`
            : '';

        return `You are a helpful AI assistant.${folderInfo}${toolsInfo}\n\nBe clear, explain what you're doing, and suggest related actions.`;
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
                const formattedTool = {
                    name: `${serverTools.serverName}_${tool.name}`,
                    description: `[${serverTools.serverName}] ${tool.description}`,
                    input_schema: tool.inputSchema
                };
                tools.push(formattedTool);
                console.log('Added tool for Claude:', formattedTool.name, formattedTool.description);
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


        console.log('Parsed server:', serverName, 'tool:', actualToolName);

        try {
            const result = await mcpService.callTool(serverName, actualToolName, input);

            console.log('MCP tool result:', result);

            // Extract text content from the result
            if (result && result.result && result.result.content) {
                const textContent = result.result.content
                    .filter((item: any) => item.type === 'text')
                    .map((item: any) => item.text)
                    .join('\n');
                return textContent || 'Tool executed successfully';
            }

            // Handle direct content array (some MCP servers return this format)
            if (result && Array.isArray(result.content)) {
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

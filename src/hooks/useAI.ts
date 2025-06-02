// import { useState, useCallback } from 'react';
// import { invoke } from '@tauri-apps/api/tauri';

// export interface ChatMessage {
//   id: string;
//   sender: 'user' | 'assistant';
//   content: string;
//   timestamp: Date;
// }

// interface AIRequest {
//   message: string;
//   context?: string;
//   language?: string;
// }

// interface AIResponse {
//   response: string;
//   suggestions: string[];
// }

// export const useAI = () => {
//   const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [currentContext, setCurrentContext] = useState<string>('');

//   const addMessage = useCallback((sender: 'user' | 'assistant', content: string) => {
//     const message: ChatMessage = {
//       id: `msg-${Date.now()}-${Math.random()}`,
//       sender,
//       content,
//       timestamp: new Date()
//     };
    
//     setChatHistory(prev => [...prev, message]);
//     return message.id;
//   }, []);

//   const updateMessage = useCallback((id: string, content: string) => {
//     setChatHistory(prev => prev.map(msg => 
//       msg.id === id ? { ...msg, content } : msg
//     ));
//   }, []);

//   const sendMessage = useCallback(async (message: string, context?: string, language?: string) => {
//     if (!message.trim()) return;

//     // Add user message
//     addMessage('user', message);
//     setIsLoading(true);

//     try {
//       const request: AIRequest = {
//         message: message.trim(),
//         context: context || currentContext,
//         language
//       };

//       const response = await invoke<AIResponse>('send_ai_request', { request });
      
//       // Add AI response
//       addMessage('assistant', response.response);
      
//       return response;
//     } catch (error) {
//       console.error('AI request failed:', error);
//       addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   }, [addMessage, currentContext]);

//   const analyzeCode = useCallback(async (code: string, language: string) => {
//     setIsLoading(true);
    
//     try {
//       const response = await invoke<AIResponse>('analyze_code', {
//         code,
//         language
//       });

//       // Add analysis to chat
//       addMessage('user', `Analyze my ${language} code`);
//       addMessage('assistant', response.response);

//       if (response.suggestions.length > 0) {
//         const suggestionsText = 'Suggestions:\n' + response.suggestions.map(s => `• ${s}`).join('\n');
//         addMessage('assistant', suggestionsText);
//       }

//       return response;
//     } catch (error) {
//       console.error('Code analysis failed:', error);
//       addMessage('assistant', 'Failed to analyze code. Please try again.');
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   }, [addMessage]);

//   const explainCode = useCallback(async (code: string, language: string) => {
//     const message = `Please explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
//     return sendMessage(message, code, language);
//   }, [sendMessage]);

//   const suggestImprovements = useCallback(async (code: string, language: string) => {
//     const message = `Please suggest improvements for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
//     return sendMessage(message, code, language);
//   }, [sendMessage]);

//   const fixErrors = useCallback(async (code: string, error: string, language: string) => {
//     const message = `I'm getting this error in my ${language} code:\n\nError: ${error}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nCan you help me fix it?`;
//     return sendMessage(message, code, language);
//   }, [sendMessage]);

//   const generateCode = useCallback(async (description: string, language: string) => {
//     const message = `Please generate ${language} code for: ${description}`;
//     return sendMessage(message, '', language);
//   }, [sendMessage]);

//   const clearChat = useCallback(() => {
//     setChatHistory([]);
//   }, []);

//   const setContext = useCallback((context: string) => {
//     setCurrentContext(context);
//   }, []);

//   return {
//     chatHistory,
//     isLoading,
//     sendMessage,
//     analyzeCode,
//     explainCode,
//     suggestImprovements,
//     fixErrors,
//     generateCode,
//     clearChat,
//     setContext,
//     addMessage,
//     updateMessage
//   };
// };
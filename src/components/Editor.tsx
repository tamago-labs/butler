import React, { useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface EditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  onCursorPositionChange?: (position: { line: number; column: number }) => void;
}

const Editor: React.FC<EditorProps> = ({
  value,
  language,
  onChange,
  onCursorPositionChange
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    
    // Use the built-in vs-dark theme first
    monaco.editor.setTheme('vs-dark');
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: 'boundary',
      automaticLayout: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      parameterHints: { enabled: true },
      formatOnType: true,
      formatOnPaste: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: true,
      smoothScrolling: true,
      fontLigatures: true,
      renderLineHighlight: 'line',
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
        highlightActiveIndentation: true,
      },
    });

    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorPositionChange) {
        onCursorPositionChange({
          line: e.position.lineNumber,
          column: e.position.column
        });
      }
    });

    setupIntelliSense(editor, language);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  return (
    <div className="flex-1 bg-editor-bg">
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: 'boundary',
          automaticLayout: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: true,
          smoothScrolling: true,
          fontLigatures: true,
          renderLineHighlight: 'line',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
            highlightActiveIndentation: true,
          },
        }}
      />
    </div>
  );
};

function setupIntelliSense(
  editor: monaco.editor.IStandaloneCodeEditor,
  language: string
) {
  // Enhanced completion provider
  monaco.languages.registerCompletionItemProvider(language, {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: monaco.languages.CompletionItem[] = [];

      // Language-specific suggestions
      if (language === 'javascript' || language === 'typescript') {
        suggestions.push(
          {
            label: 'console.log',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'console.log(${1:value});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Logs a value to the console',
            range,
          },
          {
            label: 'async function',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'async function ${1:name}(${2:params}) {\n\t${3:// TODO: implement}\n\treturn ${4:result};\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Create an async function',
            range,
          },
          {
            label: 'try-catch',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'try {\n\t${1:// code}\n} catch (${2:error}) {\n\t${3:console.error(error);}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Try-catch block',
            range,
          },
          {
            label: 'React Component',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'const ${1:ComponentName} = () => {\n\treturn (\n\t\t<div>\n\t\t\t${2:// content}\n\t\t</div>\n\t);\n};\n\nexport default ${1:ComponentName};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Create a React functional component',
            range,
          }
        );
      }

      if (language === 'python') {
        suggestions.push(
          {
            label: 'def function',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'def ${1:function_name}(${2:params}):\n\t"""${3:docstring}"""\n\t${4:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Create a Python function',
            range,
          },
          {
            label: 'class',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'class ${1:ClassName}:\n\t"""${2:docstring}"""\n\t\n\tdef __init__(self${3:, params}):\n\t\t${4:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Create a Python class',
            range,
          },
          {
            label: 'if __name__ == "__main__"',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'if __name__ == "__main__":\n\t${1:main()}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Python main guard',
            range,
          }
        );
      }

      return { suggestions };
    },
  });

  // Hover provider for documentation
  monaco.languages.registerHoverProvider(language, {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return;

      const documentation = getDocumentation(word.word, language);
      
      if (documentation) {
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `**${word.word}**` },
            { value: documentation }
          ],
        };
      }
    },
  });
}

function getDocumentation(word: string, language: string): string | null {
  const docs: Record<string, Record<string, string>> = {
    javascript: {
      'console': 'The console object provides access to the browser debugging console.',
      'async': 'The async keyword is used to declare an asynchronous function.',
      'await': 'The await operator waits for a Promise to resolve.',
      'Promise': 'The Promise object represents the eventual completion of an asynchronous operation.',
      'const': 'Declares a block-scoped constant.',
      'let': 'Declares a block-scoped variable.',
      'var': 'Declares a function-scoped or globally-scoped variable.',
      'function': 'Declares a function.',
    },
    typescript: {
      'interface': 'An interface declaration defines a type that can be implemented by classes or satisfied by objects.',
      'type': 'Type aliases create a new name for any type.',
      'generic': 'Generics provide a way to make components work with any data type.',
      'extends': 'The extends keyword is used to create inheritance relationships.',
    },
    python: {
      'def': 'The def keyword is used to define a function in Python.',
      'class': 'The class keyword is used to define a class in Python.',
      'import': 'The import statement is used to import modules in Python.',
      'async': 'The async keyword is used to define asynchronous functions in Python.',
      'lambda': 'A lambda function is a small anonymous function.',
      'yield': 'The yield keyword is used to create generator functions.',
    },
  };

  return docs[language]?.[word] || null;
}

export default Editor;

import { useToast } from '@/hooks/use-toast';

// Store API keys with a simple rotation mechanism
const API_KEYS = [
  'ulLB54MVo3lV2qHO5eXIMIe1625NmTP599Kmqbux',
  'PO1PHKGnxqzwp81mK91U4Nha0XCqJSqoyExOGdE9'
];

let currentKeyIndex = 0;

// Function to get the next API key in rotation
const getNextApiKey = (): string => {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
};

// Interface for generation options
interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

// Main function to generate content using Cohere API
export const generateContent = async (
  prompt: string,
  options: GenerationOptions = {}
): Promise<string> => {
  const {
    maxTokens = 300,
    temperature = 0.7,
    model = 'command'
  } = options;

  // Get API key with rotation
  const apiKey = getNextApiKey();

  try {
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        max_tokens: maxTokens,
        temperature,
        k: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate content');
    }

    const data = await response.json();
    return data.generations[0].text.trim();
  } catch (error: any) {
    console.error('Cohere API error:', error);
    throw new Error(error.message || 'Failed to generate content');
  }
};

// Helper function to generate a note
export const generateNote = async (content: string): Promise<string> => {
  const prompt = `Write a detailed note about: ${content}. Make it informative and well-structured.`;
  return generateContent(prompt, { maxTokens: 400 });
};

// Helper function to generate a code snippet
export const generateSnippet = async (content: string): Promise<{ code: string, language: string }> => {
  const prompt = `Create a code snippet for: ${content}. Only return the code, no explanations.`;
  
  const generatedCode = await generateContent(prompt, { 
    maxTokens: 500,
    temperature: 0.5
  });
  
  // Try to detect the language from the content
  let language = 'javascript'; // Default
  
  const languageKeywords: Record<string, string[]> = {
    'javascript': ['const', 'let', 'var', 'function', 'async', 'await', 'import', 'export', 'console.log'],
    'typescript': ['interface', 'type', 'enum', '<T>', 'as const', 'readonly'],
    'python': ['def', 'import', 'from', 'class', 'if __name__', 'print('],
    'java': ['public class', 'private', 'protected', 'void', 'String[]', 'System.out'],
    'html': ['<!DOCTYPE', '<html>', '<div>', '<body>', '<head>'],
    'css': ['{', 'margin:', 'padding:', 'color:', 'background:'],
    'sql': ['SELECT', 'FROM', 'WHERE', 'JOIN', 'GROUP BY', 'ORDER BY'],
    'bash': ['#!/bin/bash', 'echo', 'chmod', 'mkdir', 'ls', 'cd']
  };
  
  // Simple language detection based on keywords
  for (const [lang, keywords] of Object.entries(languageKeywords)) {
    if (keywords.some(keyword => generatedCode.includes(keyword))) {
      language = lang;
      break;
    }
  }
  
  return { code: generatedCode, language };
};

// Helper function to generate a checklist
export const generateChecklist = async (content: string): Promise<{ text: string, checked: boolean }[]> => {
  const prompt = `Create a checklist for: ${content}. Format as a list with each item on a new line. Only include the items, no explanations or numbering.`;
  
  const generatedContent = await generateContent(prompt, { 
    maxTokens: 350,
    temperature: 0.7
  });
  
  // Split by new lines and create checklist items
  return generatedContent
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => ({
      text: line.trim().replace(/^[-*•]\s*/, ''), // Remove any list markers
      checked: false
    }));
};
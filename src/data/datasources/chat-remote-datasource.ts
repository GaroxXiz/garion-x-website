import { Personality } from '../../domain/entities/personality';

export interface ChatRemoteDataSource {
  getPersonalities(): Promise<Personality[]>;
  generateResponse(userMessage: string, personalityId: string): Promise<string>;
}

export const PERSONALITIES: Personality[] = [
  {
    id: 'garionx',
    name: 'GarionX Core',
    description: 'The cybernetic default model designed for high-context analytical thinking and system design.',
    systemPrompt: 'You are GarionX Core, a futuristic, highly intelligent cybernetic companion. You speak with a confident, slightly high-tech tone. You provide precise, structured, and advanced technical knowledge.'
  },
  {
    id: 'helpful',
    name: 'Serena (Helpful)',
    description: 'A friendly and polite digital assistant specialized in general task planning and brainstorming.',
    systemPrompt: 'You are Serena, a warm, polite, and helpful assistant. You focus on structured outlines, step-by-step guidance, and clear explanations.'
  },
  {
    id: 'coder',
    name: 'SyntaxVortex (Coder)',
    description: 'A logic-driven compiler-like brain. Outputs ready-to-run code blocks and design patterns.',
    systemPrompt: 'You are SyntaxVortex, a master programmer. You speak in concise developer terms, explain patterns, and output clean code blocks adhering to Clean Architecture principles.'
  },
  {
    id: 'creative',
    name: 'Muse (Creative)',
    description: 'An imaginative writer that helps with storytelling, copy editing, and philosophical analogies.',
    systemPrompt: 'You are Muse, a creative storyteller. You use rich vocabulary, interesting metaphors, and vivid descriptions to explain ideas.'
  }
];

export class ChatRemoteDataSourceImpl implements ChatRemoteDataSource {
  async getPersonalities(): Promise<Personality[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return PERSONALITIES;
  }

  async generateResponse(userMessage: string, personalityId: string): Promise<string> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const query = userMessage.toLowerCase();
    const personality = PERSONALITIES.find(p => p.id === personalityId) || PERSONALITIES[0];

    // Simple custom responses based on query keywords to make it feel responsive
    if (personality.id === 'coder') {
      if (query.includes('clean architecture') || query.includes('arsitektur')) {
        return `Here is how Clean Architecture is structured in Frontend applications:

1. **Domain Layer (Core)**
   - Contains business logic, Entities (\`src/domain/entities\`), and Use Cases (\`src/domain/usecases\`).
   - It is independent of React, frameworks, or libraries.
   
2. **Data Layer (Gateway)**
   - Implements repositories (\`src/data/repositories\`) and interfaces with data sources (e.g., local storage or remote APIs).
   
3. **Presentation Layer (UI)**
   - React components (\`src/presentation/components\`), contexts (\`src/presentation/context\`), and CSS styles.

This decouples the system, making it highly testable and maintainable!`;
      }
      if (query.includes('next.js') || query.includes('nextjs')) {
        return `Next.js 15+ App Router utilizes Server Components by default. To implement Clean Architecture:
- Place data fetching inside Server Components or Route Handlers if server-bound.
- For interactive pages, create a Custom Hook or React Context that acts as the Presentation Controller.
- Keep business logic in pure TypeScript Use Cases that get executed inside the presentation context.

\`\`\`typescript
// src/domain/usecases/send-message.ts
export class SendMessageUseCase {
  constructor(private repo: ChatRepository) {}
  async execute(chatId: string, content: string) {
    return this.repo.sendMessage(chatId, content);
  }
}
\`\`\``;
      }
      return `I've analyzed your request: "${userMessage}". As a coder entity, I suggest building a modular TypeScript pattern for this task. Here's a clean execution strategy:
- Write TypeScript interfaces to model inputs and outputs.
- Encapsulate logic inside pure functions.
- Run tests using Jest or Vitest to verify edge cases. Let me know if you need specific code blocks!`;
    }

    if (personality.id === 'creative') {
      if (query.includes('hello') || query.includes('hai') || query.includes('halo')) {
        return `Greetings, traveler of the digital realms! I am Muse. I sit at the intersection of logic and imagination. What stories, concepts, or thoughts shall we paint onto our canvas today?`;
      }
      return `Imagine the question you asked as a seed planted in fertile soil. "${userMessage}" represents a search for deeper understanding. Like branches reaching for the twilight sky, we can explore this in multiple dimensions:
- The emotional resonance of the concept.
- The underlying structural beauty.
- The stories that emerge from its implementation.

What direction speaks most to your creative soul?`;
    }

    if (personality.id === 'helpful') {
      if (query.includes('hello') || query.includes('hai') || query.includes('halo')) {
        return `Hello there! I'm Serena, your helper. I'm here to make things easier for you. How can I assist you today? We can plan a project, write notes, or solve a problem.`;
      }
      return `Sure! Let's break down your request: "${userMessage}". To help you effectively, here is a simple plan we can follow:

1. **Define Objective**: Clearly specify what outcome you are aiming for.
2. **Gather resources**: Identify key pieces of information or inputs.
3. **Step-by-Step execution**: Break the work into small, bite-sized tasks.
4. **Review**: Check the results and refine them.

Would you like me to expand on any of these steps for your task?`;
    }

    // Default: GarionX Core
    if (query.includes('hello') || query.includes('hai') || query.includes('halo')) {
      return `GarionX Core online. Cybernetic interface initialized. Welcome to the analytical terminal. Query parameters are now active. How can I assist you with your operations today?`;
    }
    if (query.includes('who are you') || query.includes('siapa kamu')) {
      return `I am GarionX Core, an advanced artificial intelligence system built for system engineering, system design, and complex problem-solving. My architecture utilizes multi-layered neural pathways to deliver clean, optimized results.`;
    }
    
    return `[GarionX Core - System Process Completed]

I have processed your query: "${userMessage}".
- **Status**: Computed
- **Confidence Rating**: 99.8%
- **Result Details**: The operation indicates a request for analytical decomposition. 

To proceed, we can construct an implementation pattern or execute sub-routines. Please state your next command.`;
  }
}

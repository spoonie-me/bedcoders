export interface CourseBlueprint {
  courseId: string;
  title: string;
  description: string;
  modules: {
    name: string;
    topics: string[];
  }[];
}

export const COURSES: Record<string, CourseBlueprint[]> = {
  fundamentals: [
    {
      courseId: 'code-with-claude',
      title: '🛏️ Code from Bed',
      description: 'Learn to code with Claude. No morning meetings required. Build real stuff without leaving your cozy workspace.',
      modules: [
        { name: 'Getting Started', topics: ['Claude Basics', 'Your First Prompt', 'Setting Up Your Workspace'] },
        { name: 'Core Concepts', topics: ['Variables & Types', 'Functions & Logic', 'Working with Data'] },
        { name: 'Building Projects', topics: ['Your First App', 'Debugging with AI', 'Shipping Code'] },
        { name: 'Going Deeper', topics: ['APIs & Integration', 'Testing Code', 'Performance Basics'] },
        { name: 'Lazy Coding = Smart Coding', topics: ['Automation First', 'AI as Pair Programmer', 'Building Smart Tools'] },
      ],
    },
  ],
  ai: [
    {
      courseId: 'ai-literacy',
      title: '🤖 AI Literacy for Humans',
      description: 'Actually understand what Claude does. Master prompting. Use AI like a pro, not a parrot.',
      modules: [
        { name: 'AI Fundamentals', topics: ['How LLMs Work', 'Tokens & Context', 'Model Capabilities'] },
        { name: 'Prompt Engineering', topics: ['Good Prompts', 'Chain of Thought', 'System Instructions'] },
        { name: 'Building with APIs', topics: ['Claude API Basics', 'Error Handling', 'Rate Limits'] },
        { name: 'Advanced Tricks', topics: ['Function Calling', 'Multi-turn Conversations', 'Vision & Images'] },
        { name: 'Ethics & Vibes', topics: ['Bias in AI', 'Privacy', 'Using AI Responsibly'] },
      ],
    },
  ],
  tools: [
    {
      courseId: 'build-tools',
      title: '⚡ Build Cool Tools Fast',
      description: 'Make tools that save you hours. Use AI to do the boring stuff. Ship in days, not months.',
      modules: [
        { name: 'Tool Basics', topics: ['CLI Tools', 'Web Apps', 'Automation Scripts'] },
        { name: 'AI-Powered Tools', topics: ['Content Generation', 'Code Analysis', 'Data Processing'] },
        { name: 'Smart Architecture', topics: ['Caching', 'Streaming', 'Batch Processing'] },
        { name: 'Get It Live', topics: ['Serverless', 'Docker', 'Cloud Platforms'] },
        { name: 'Get Paid', topics: ['API Pricing', 'SaaS Models', 'Sustainable Tools'] },
      ],
    },
  ],
  advanced: [
    {
      courseId: 'ai-agents',
      title: '🚀 AI Agents that Work',
      description: 'Create AI agents that actually do stuff. Research, code, debug, solve problems. The future is now.',
      modules: [
        { name: 'Agent Foundations', topics: ['Agent Loops', 'Tool Use', 'State Management'] },
        { name: 'Planning & Reasoning', topics: ['Goal Setting', 'Breaking Tasks Down', 'Adaptive Strategies'] },
        { name: 'Memory Systems', topics: ['Context Windows', 'Long-term Memory', 'Knowledge Bases'] },
        { name: 'Real-World Agents', topics: ['Research Agents', 'Code Agents', 'Support Bots'] },
        { name: 'Ship & Monitor', topics: ['Cost Optimization', 'Safety', 'Observability'] },
      ],
    },
  ],
};

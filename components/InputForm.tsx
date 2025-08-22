import React, { useState } from 'react';
import SparklesIcon from './icons/SparklesIcon';

interface InputFormProps {
  appIdea: string;
  setAppIdea: (idea: string) => void;
  techStack: string;
  setTechStack: (stack: string) => void;
  architectureChoice: string;
  setArchitectureChoice: (choice: string) => void;
  databaseType: string;
  setDatabaseType: (type: string) => void;
  keyFeatures: string;
  setKeyFeatures: (features: string) => void;
  appComplexity: string;
  setAppComplexity: (complexity: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  generationCount: number;
  generationLimit: number;
}

interface Example {
    idea: string;
    features: string;
    techStack?: string;
    architecture?: string;
    complexity?: string;
    database?: string;
}

const examples: Example[] = [
    { idea: "A recipe sharing platform where users can post recipes and create meal plans.", features: "Recipe CRUD, user authentication, meal planner", complexity: "Standard (MVP)", database: "PostgreSQL" },
    { idea: "An e-commerce site for custom-printed T-shirts with a design editor.", features: "Product catalog, Stripe integration, image uploads", techStack: "Node.js (Express)", architecture: "Monolithic", complexity: "Scalable / Production", database: "MongoDB" },
    { idea: "A real-time language translation chat application.", features: "WebSocket chat, user accounts, message history", techStack: "Go (Gin)", architecture: "Event-Driven", complexity: "Scalable / Production", database: "Redis" },
    { idea: "A fitness tracker app that logs workouts and visualizes progress.", features: "Workout logging, data visualization, user goals", techStack: "Python (Django)", architecture: "Monolithic", complexity: "Standard (MVP)", database: "PostgreSQL" },
    { idea: "A booking system for a local barbershop.", features: "Appointment scheduling, service management, email reminders", techStack: "PHP (Laravel)", architecture: "Monolithic", complexity: "Simple / Prototyping", database: "MySQL" },
    { idea: "A collaborative project management tool like a simple Trello.", features: "Kanban boards, task assignments, real-time updates", techStack: "Ruby on Rails", architecture: "Monolithic", complexity: "Standard (MVP)", database: "PostgreSQL" },
    { idea: "A music streaming service that recommends songs based on listening history.", features: "Audio streaming, user playlists, recommendation engine", techStack: "Java (Spring Boot)", architecture: "Microservices", complexity: "Scalable / Production", database: "Cassandra" },
    { idea: "A blog platform with a Markdown editor and comments.", features: "Post creation, user comments, rich text editing", techStack: "Python (Flask)", architecture: "", complexity: "Simple / Prototyping", database: "SQLite" },
    { idea: "A URL shortener service like Bitly with analytics.", features: "Shorten URL, custom aliases, click tracking", techStack: "Python (Flask)", architecture: "Monolithic", complexity: "Standard (MVP)", database: "Redis" },
    { idea: "An API to serve a machine learning model for image recognition.", features: "Image upload endpoint, run inference, return prediction", techStack: "Python (Flask)", architecture: "Microservices", complexity: "Standard (MVP)", database: "JSON (File-based)" },
    { idea: "Backend for a real-time stock price dashboard.", features: "Fetch data from financial API, WebSocket updates, user watchlist", techStack: "Python (Flask)", architecture: "Event-Driven", complexity: "Scalable / Production", database: "PostgreSQL" },
    { idea: "A simple community forum or message board application.", features: "User registration, create topics/posts, threaded comments", techStack: "Python (Flask)", architecture: "Monolithic", complexity: "Standard (MVP)", database: "PostgreSQL" },
    { idea: "A pet adoption platform connecting shelters with potential adopters.", features: "Pet profiles, search and filter, application forms", techStack: "C# (ASP.NET Core)", architecture: "Monolithic", complexity: "Standard (MVP)", database: "SQL Server" },
    { idea: "An internal tool for a company to track employee vacation days.", features: "Leave requests, approval workflow, calendar view", complexity: "Standard (MVP)", database: "PostgreSQL" },
    { idea: "IoT dashboard for monitoring smart home devices in real-time.", features: "Real-time data streams, device control, user alerts", techStack: "Node.js (Express)", architecture: "Event-Driven", complexity: "Scalable / Production", database: "InfluxDB" },
    { idea: "A ride-sharing app backend similar to Uber.", features: "Geolocation tracking, trip matching, payment processing", techStack: "Go (Gin)", architecture: "Microservices", complexity: "Enterprise / High-Complexity", database: "PostgreSQL" },
    { idea: "An online learning platform with video courses and quizzes.", features: "Video streaming, course progression, user authentication", techStack: "Python (Django)", architecture: "Hexagonal (Ports & Adapters)", complexity: "Scalable / Production", database: "PostgreSQL" },
    { idea: "A serverless API for a financial news aggregator.", features: "Data ingestion from multiple sources, REST API for news articles, user subscriptions", techStack: "Python (Flask)", architecture: "Serverless", complexity: "Scalable / Production", database: "DynamoDB" },
    { idea: "Backend for a turn-based multiplayer strategy game.", features: "Matchmaking, game state management, leaderboards", techStack: "Java (Spring Boot)", architecture: "CQRS", complexity: "Scalable / Production", database: "Redis" },
    { idea: "A personal finance tracker that uses AI to categorize expenses and provide savings suggestions.", features: "Automated expense tracking, AI-powered insights, budget planning", techStack: "Python (Django)", architecture: "Monolithic", complexity: "Standard (MVP)", database: "PostgreSQL" },
    { idea: "A real-time collaborative document editor like Google Docs.", features: "Real-time text sync (CRDTs), user presence, document versioning", techStack: "Node.js (Express)", architecture: "Event-Driven", complexity: "Enterprise / High-Complexity", database: "MongoDB" },
    { idea: "A website uptime monitoring service that sends alerts on downtime.", features: "Scheduled health checks, email/SMS alerts, performance dashboards", techStack: "Go (Gin)", architecture: "Microservices", complexity: "Scalable / Production", database: "Prometheus" },
    { idea: "A mental wellness and journaling app with mood tracking and guided meditations.", features: "Private journaling, mood analytics, audio streaming", techStack: "Ruby on Rails", architecture: "Monolithic", complexity: "Standard (MVP)", database: "PostgreSQL" },
    { idea: "A subscription-based meal kit delivery service.", features: "Recipe management, subscription billing, delivery logistics", techStack: "PHP (Laravel)", architecture: "Monolithic", complexity: "Scalable / Production", database: "MySQL" },
    { idea: "A platform for developers to share and discover public APIs.", features: "API listing, user reviews, search and categorization", techStack: "Python (Flask)", architecture: "", complexity: "Standard (MVP)", database: "JSON (File-based)" },
    { idea: "An inventory management system for a small business.", features: "Product tracking, stock level alerts, purchase order management", techStack: "C# (ASP.NET Core)", architecture: "Monolithic", complexity: "Standard (MVP)", database: "SQL Server" }
];


const InputForm: React.FC<InputFormProps> = ({
  appIdea,
  setAppIdea,
  techStack,
  setTechStack,
  architectureChoice,
  setArchitectureChoice,
  databaseType,
  setDatabaseType,
  keyFeatures,
  setKeyFeatures,
  appComplexity,
  setAppComplexity,
  onGenerate,
  isLoading,
  generationCount,
  generationLimit,
}) => {
  const isLimitReached = generationCount >= generationLimit;
  const [lastExampleIndex, setLastExampleIndex] = useState<number | null>(null);

  const getButtonText = () => {
    if (isLimitReached) return 'Limit Reached';
    if (isLoading) return 'Generating...';
    return 'Generate Plan';
  };

  const handleTryExample = () => {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * examples.length);
    } while (examples.length > 1 && randomIndex === lastExampleIndex);

    setLastExampleIndex(randomIndex);
    const example = examples[randomIndex];
    setAppIdea(example.idea);
    setKeyFeatures(example.features);
    setTechStack(example.techStack || '');
    setArchitectureChoice(example.architecture || '');
    setAppComplexity(example.complexity || 'Standard (MVP)');
    setDatabaseType(example.database || '');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <div className="space-y-6">
          <textarea
            value={appIdea}
            onChange={(e) => setAppIdea(e.target.value)}
            placeholder="Describe your application idea... e.g., 'A social media app for pet owners to share photos and schedule playdates.'"
            className="w-full h-40 p-4 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary focus:outline-none resize-none transition-colors"
            disabled={isLoading || isLimitReached}
          />
           <div>
              <label htmlFor="key-features" className="block text-sm font-medium text-gray-400 mb-2">
                  Key Features (Optional)
              </label>
              <input
                  type="text"
                  id="key-features"
                  value={keyFeatures}
                  onChange={(e) => setKeyFeatures(e.target.value)}
                  placeholder="e.g., User profiles, photo uploads, real-time chat"
                  className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                  disabled={isLoading || isLimitReached}
              />
              <p className="text-xs text-gray-500 mt-2">
                  List 1-3 core features to help the AI prioritize the plan.
              </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label htmlFor="tech-stack" className="block text-sm font-medium text-gray-400 mb-2">
                Technology Stack (Optional)
              </label>
              <select
                id="tech-stack"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary focus:outline-none transition-colors h-14"
                disabled={isLoading || isLimitReached}
              >
                <option value="">Generic / Agnostic</option>
                <option value="Node.js (Express)">Node.js (Express)</option>
                <option value="Python (Django)">Python (Django)</option>
                <option value="Python (Flask)">Python (Flask)</option>
                <option value="Go (Gin)">Go (Gin)</option>
                <option value="Ruby on Rails">Ruby on Rails</option>
                <option value="Java (Spring Boot)">Java (Spring Boot)</option>
                <option value="PHP (Laravel)">PHP (Laravel)</option>
                <option value="C# (ASP.NET Core)">C# (ASP.NET Core)</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Select a stack to get framework-specific code.
              </p>
            </div>
            <div>
              <label htmlFor="architecture-choice" className="block text-sm font-medium text-gray-400 mb-2">
                Architecture
              </label>
              <select
                id="architecture-choice"
                value={architectureChoice}
                onChange={(e) => setArchitectureChoice(e.target.value)}
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary focus:outline-none transition-colors h-14"
                disabled={isLoading || isLimitReached}
              >
                <option value="">Auto-select Best</option>
                <option value="Monolithic">Monolithic</option>
                <option value="Microservices">Microservices</option>
                <option value="Serverless">Serverless</option>
                <option value="Event-Driven">Event-Driven</option>
                <option value="Hexagonal (Ports & Adapters)">Hexagonal (Ports & Adapters)</option>
                <option value="CQRS">CQRS</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Guide the AI or let it choose the best architecture.
              </p>
            </div>
            <div>
              <label htmlFor="database-type" className="block text-sm font-medium text-gray-400 mb-2">
                Database Type
              </label>
              <select
                id="database-type"
                value={databaseType}
                onChange={(e) => setDatabaseType(e.target.value)}
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary focus:outline-none transition-colors h-14"
                disabled={isLoading || isLimitReached}
              >
                <option value="">Auto-select Best</option>
                <option value="PostgreSQL">PostgreSQL (Relational)</option>
                <option value="MySQL">MySQL (Relational)</option>
                <option value="MongoDB">MongoDB (NoSQL)</option>
                <option value="Redis">Redis (In-Memory)</option>
                <option value="SQLite">SQLite (File-based)</option>
                <option value="JSON (File-based)">JSON (File-based)</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Select a database to tailor models and code.
              </p>
            </div>
            <div>
              <label htmlFor="app-complexity" className="block text-sm font-medium text-gray-400 mb-2">
                Application Complexity
              </label>
              <select
                id="app-complexity"
                value={appComplexity}
                onChange={(e) => setAppComplexity(e.target.value)}
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary focus:outline-none transition-colors h-14"
                disabled={isLoading || isLimitReached}
              >
                <option value="Simple / Prototyping">Simple / Prototyping</option>
                <option value="Standard (MVP)">Standard (MVP)</option>
                <option value="Scalable / Production">Scalable / Production</option>
                <option value="Enterprise / High-Complexity">Enterprise / High-Complexity</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Select the project scale to tailor the plan's depth.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button onClick={handleTryExample} disabled={isLoading || isLimitReached} className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-semibold transition-colors disabled:text-gray-600 disabled:cursor-not-allowed order-2 sm:order-1">
              <SparklesIcon className="w-5 h-5" />
              Try an Example
          </button>
          <div className="text-gray-400 order-1 sm:order-2 text-center">
            <span className="font-semibold text-gray-200">{generationCount}</span> / {generationLimit} generations used.
          </div>
          <button
            onClick={onGenerate}
            disabled={isLoading || isLimitReached}
            className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 order-3"
          >
            {getButtonText()}
          </button>
        </div>
        {isLimitReached && (
          <p className="text-center text-red-400 mt-4 text-sm">
            You have reached your generation limit. Please refresh for a new session later.
          </p>
        )}
      </div>
    </div>
  );
};

export default InputForm;
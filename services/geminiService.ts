import { GoogleGenAI, Type } from '@google/genai';
import { BackendPlan, ApiRoute, DatabaseModel } from '../types';

if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable not set');
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    architecture: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'e.g., Microservices, Monolithic, Serverless' },
        reasoning: { type: Type.STRING, description: 'A brief explanation for choosing this architecture.' },
        details: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Key components or services in this architecture.'
        },
      },
    },
    database: {
        type: Type.OBJECT,
        description: "Information about the chosen database.",
        properties: {
            type: { type: Type.STRING, description: "The name of the database technology (e.g., PostgreSQL, MongoDB)." },
            reasoning: { type: Type.STRING, description: "A brief explanation for why this database was chosen." }
        }
    },
    databaseModels: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Name of the database table or collection (e.g., User, Product).' },
          description: { type: Type.STRING, description: 'Purpose of this model.' },
          fields: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'Field name (e.g., id, username, createdAt).' },
                type: { type: Type.STRING, description: 'Database-specific data type (e.g., VARCHAR(255), INTEGER, TEXT for SQL; String, ObjectId, Date for NoSQL).' },
                description: { type: Type.STRING, description: 'Description of the field, including constraints like PRIMARY KEY, FOREIGN KEY, NOT NULL, or if it should be indexed.' },
              },
            },
          },
        },
      },
    },
    apiRoutes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          method: { type: Type.STRING, description: 'HTTP method (GET, POST, PUT, DELETE, PATCH).' },
          path: { type: Type.STRING, description: 'API endpoint path (e.g., /api/v1/users/:id).' },
          description: { type: Type.STRING, description: 'What this endpoint does.' },
          requestBodyExample: { type: Type.STRING, description: 'Example JSON for the request body, or a framework-specific code snippet if a tech stack is chosen.' },
          responseBodyExample: { type: Type.STRING, description: 'Example JSON for a successful response body.' },
        },
      },
    },
    securityConsiderations: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'The name of the security or scalability topic (e.g., Authentication, Rate Limiting).' },
                description: { type: Type.STRING, description: 'A brief, practical recommendation for the topic.'}
            }
        }
    },
    umlDiagram: {
        type: Type.STRING,
        description: "A class diagram in valid, error-free PlantUML syntax representing the database models and their relationships. Exclude @startuml and @enduml tags."
    },
    developmentTooling: {
        type: Type.OBJECT,
        nullable: true,
        description: 'Development tooling recommendations, only included if a technology stack is specified.',
        properties: {
            techRationale: { type: Type.STRING, description: 'A brief rationale explaining why the chosen tech stack is a good fit for this project.' },
            recommendedLibraries: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: 'The name of a recommended library or package.' },
                        description: { type: Type.STRING, description: 'What the library is used for (e.g., ORM, authentication, validation).' }
                    }
                }
            },
            dockerCompose: { type: Type.STRING, description: 'A complete, ready-to-use docker-compose.yml file to set up a local development environment (e.g., with a database service).' }
        }
    },
    deployment: {
        type: Type.OBJECT,
        nullable: true,
        description: 'Deployment suggestions including a recommended platform and a Dockerfile.',
        properties: {
            platform: { type: Type.STRING, description: 'The recommended deployment platform (e.g., Vercel, AWS Lambda, Docker on a VM).' },
            reasoning: { type: Type.STRING, description: 'Why this platform is a good fit.' },
            dockerfile: { type: Type.STRING, description: 'A basic, complete, and ready-to-use Dockerfile for the selected technology stack.' }
        }
    },
    gettingStarted: {
        type: Type.OBJECT,
        nullable: true,
        description: 'A getting started guide, only included if a technology stack is specified by the user.',
        properties: {
            introduction: { type: Type.STRING, description: 'A brief intro to setting up the project with the chosen stack.'},
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        command: { type: Type.STRING, description: 'The terminal command to run.'},
                        description: { type: Type.STRING, description: 'What the command does.'}
                    }
                }
            },
            fileStructure: { type: Type.STRING, description: 'A suggested file/directory structure for the project, formatted as a code block.'}
        }
    }
  },
};

export const generateBackendPlan = async (
  appIdea: string,
  techStack: string,
  architectureChoice: string,
  databaseType: string,
  keyFeatures: string,
  appComplexity: string,
  onChunk: (text: string) => void
): Promise<BackendPlan> => {
    const techStackInstruction = techStack
    ? `
      The user has selected the following technology stack: **${techStack}**.
      - All code examples (like in the requestBodyExample for API routes) and architectural details must be tailored specifically for **${techStack}**.
      - You **must** generate a "Getting Started" plan with setup commands and file structure.
      - You **must also** generate a "Development & Tooling" section. This section must include:
        1. A brief rationale for why ${techStack} is a good fit.
        2. A list of 2-4 essential third-party libraries or packages for this stack (e.g., for ORM/database, authentication, validation).
        3. A complete and ready-to-use \`docker-compose.yml\` file to spin up a local development environment. For example, if the project needs a database, include a service for it (like postgres or mongo).
    `
    : `
      No specific technology stack was chosen. Keep the plan high-level and technology-agnostic. Do not include a "Getting Started" or "Development & Tooling" section. Ensure the 'gettingStarted' and 'developmentTooling' fields in the JSON are null.
    `;

    const architectureInstruction = architectureChoice
    ? `The user has requested a specific architecture: **${architectureChoice}**. You must design the plan based on this choice.`
    : `The user has not specified an architecture. You must analyze the application idea and recommend the most suitable one (e.g., Monolithic, Microservices, Serverless), providing clear reasoning for your choice.`;
    
    const databaseInstruction = databaseType
    ? `The user has selected a specific database: **${databaseType}**. You MUST tailor the database models, data types, and any generated code (e.g., ORM usage in route implementations) for this database. For the 'database.type' field, return '${databaseType}'. For the 'database.reasoning' field, explain why this is a suitable choice.`
    : `The user has not specified a database. You must analyze the application idea and select the best one (e.g., PostgreSQL for relational data, MongoDB for unstructured data, etc.). You MUST provide the chosen database name in the 'database.type' field and a clear justification in the 'database.reasoning' field.`;

    const keyFeaturesInstruction = keyFeatures
    ? `The user has highlighted these key features as most important: **${keyFeatures}**. You must prioritize the database models and API routes that are essential for implementing these features first.`
    : `The user has not specified key features. Assume a standard implementation priority.`;
    
    const complexityInstruction = `
      The user has specified the application's complexity level as: **${appComplexity}**. You must tailor the entire plan according to this level.
      - **Simple / Prototyping**: The plan should be minimal and straightforward. Focus on the quickest path to a working prototype. Use simple tools and patterns. Security and scalability are low priority.
      - **Standard (MVP)**: The plan should be for a Minimum Viable Product. It needs a solid foundation but should avoid over-engineering. Include standard security practices (authentication, input validation) and a reasonably structured database.
      - **Scalable / Production**: The plan is for a production application expected to grow. You must include considerations for scalability (e.g., caching strategies, message queues, stateless services). The database design should be optimized. Security must be robust. Suggest appropriate logging and monitoring.
      - **Enterprise / High-Complexity**: The plan is for a mission-critical, large-scale application. Prioritize high availability, fault tolerance, and advanced security. Suggest detailed monitoring, CI/CD pipelines, and potentially more complex patterns like CQRS or event sourcing if relevant. The plan must be comprehensive and detailed.
    `;

  const prompt = `
    You are a world-class senior backend architect.
    Your task is to generate a comprehensive and practical backend plan based on a user's application idea.
    
    **Core Instructions:**
    - **Technology Stack:** ${techStackInstruction}
    - **Database:** ${databaseInstruction}
    - **Application Complexity:** ${complexityInstruction}
    - **Architecture:** ${architectureInstruction}
    - **Feature Prioritization:** ${keyFeaturesInstruction}

    **Plan Structure:**
    1.  **Architecture**: Recommend a suitable backend architecture.
    2.  **Database**: State the chosen database and your reasoning.
    3.  **Database Models**: Design the necessary models. Use data types and conventions appropriate for the chosen database (e.g., SQL types like VARCHAR, INTEGER for PostgreSQL; NoSQL types like String, ObjectId for MongoDB).
    4.  **API Routes**: Define the RESTful API endpoints.
    5.  **Security & Scalability**: Provide essential advice.
    6.  **UML Diagram**: Generate a **valid, error-free** PlantUML class diagram for the database models. Show relationships like one-to-many (e.g., \`User "1" -- "0..*" Post\`). Do not include the '@startuml' and '@enduml' tags in your output.
    7.  **Development & Tooling** (if tech stack is specified).
    8.  **Deployment Suggestions**: Recommend a platform and provide a complete \`Dockerfile\`.
    9.  **Getting Started** (if tech stack is specified).

    Adhere strictly to the provided JSON schema for your response. Be concise and practical.
    
    Application Idea: "${appIdea}"
  `;

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.7,
    },
  });

  let fullResponseText = '';
  try {
    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullResponseText += chunkText;
        onChunk(chunkText);
      }
    }
  } catch (streamError) {
    console.error('Error during response stream:', streamError);
    // This provides a more specific error if the stream is interrupted.
    throw new Error('The connection to the AI was interrupted during the response. Please try again.');
  }


  try {
    let jsonString = fullResponseText.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7);
    }
    if (jsonString.endsWith('```')) {
        jsonString = jsonString.slice(0, -3);
    }

    const parsedJson = JSON.parse(jsonString);
    return parsedJson as BackendPlan;
  } catch (error) {
    console.error('Failed to parse Gemini response:', fullResponseText, error);
    throw new Error('Received an invalid format from the AI. Please try again.');
  }
};

export const generateRouteCode = async (
  context: {
    appIdea: string;
    techStack: string;
    architectureChoice: string;
    appComplexity: string;
    databaseModels: DatabaseModel[];
    databaseType: string;
  },
  route: ApiRoute
): Promise<string> => {
  if (!context.techStack) {
      return Promise.resolve(`// Code generation requires a technology stack to be selected.`);
  }

  const modelContext = JSON.stringify(context.databaseModels, null, 2);

  const databaseCodeInstruction = `The project is using **${context.databaseType}**.
  - Your generated code **must** use appropriate libraries and conventions for this database.
  - For example, if the stack is Node.js and the database is PostgreSQL, use an ORM like Sequelize or a query builder like Knex.js.
  - If the stack is Node.js and the database is MongoDB, use a library like Mongoose or the native MongoDB driver.
  - Ensure database connection logic is handled correctly within the context of the framework.`;

  const prompt = `
    You are an expert software engineer specializing in the ${context.techStack} framework.
    Your task is to write a complete, production-ready code implementation for a single API route handler/controller based on the provided context.

    **Project Context:**
    - **Application Idea:** ${context.appIdea}
    - **Technology Stack:** ${context.techStack}
    - **Database:** ${databaseCodeInstruction}
    - **Architecture:** ${context.architectureChoice || 'Auto-selected'}
    - **Application Complexity:** ${context.appComplexity}
    - **Existing Database Models:**
      \`\`\`json
      ${modelContext}
      \`\`\`

    **Route to Implement:**
    - **Method:** ${route.method}
    - **Path:** ${route.path}
    - **Description:** ${route.description}

    **Instructions:**
    1.  Write the full code for the route handler/controller function.
    2.  Include all necessary imports from the ${context.techStack} framework and common libraries.
    3.  Implement proper request validation, error handling (e.g., try-catch blocks, sending appropriate HTTP status codes), and database interaction logic.
    4.  The code should be clean, efficient, and follow best practices for the ${context.techStack} ecosystem.
    5.  **Your response MUST be ONLY the code itself. Do not include any explanations, introductory text, or markdown formatting like \`\`\`typescript. Just the raw code.**
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.3, // Lower temperature for more deterministic code
        },
      });

      return response.text;
  } catch (error) {
    console.error(`Error generating code for route ${route.method} ${route.path}:`, error);
    throw new Error('The AI failed to generate the code. Please try again.');
  }
};
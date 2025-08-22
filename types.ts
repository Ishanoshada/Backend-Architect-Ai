export interface DatabaseField {
  name: string;
  type: string; // e.g., 'ID', 'String', 'Integer', 'DateTime', 'Boolean', 'Array<ID>', 'Object'
  description: string; // e.g., 'Primary key', 'Reference to users table', 'Required'
}

export interface DatabaseModel {
  name: string; // Table/Collection name
  description: string;
  fields: DatabaseField[];
}

export interface ApiRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  requestBodyExample?: string;
  responseBodyExample?: string;
}

export interface ArchitecturePlan {
  name: string;
  reasoning: string;
  details: string[];
}

export interface SecurityConsideration {
    name: string;
    description: string;
}

export interface GettingStartedStep {
    command: string;
    description: string;
}

export interface GettingStartedPlan {
    introduction: string;
    steps: GettingStartedStep[];
    fileStructure: string;
}

export interface DeploymentPlan {
    platform: string;
    reasoning: string;
    dockerfile: string;
}

export interface RecommendedLibrary {
    name: string;
    description: string;
}

export interface DevelopmentTooling {
    techRationale: string;
    recommendedLibraries: RecommendedLibrary[];
    dockerCompose: string;
}

export interface DatabaseInfo {
    type: string;
    reasoning: string;
}

export interface BackendPlan {
  architecture: ArchitecturePlan;
  database?: DatabaseInfo;
  databaseModels: DatabaseModel[];
  apiRoutes: ApiRoute[];
  securityConsiderations: SecurityConsideration[];
  umlDiagram: string;
  gettingStarted?: GettingStartedPlan;
  deployment?: DeploymentPlan;
  developmentTooling?: DevelopmentTooling;
}
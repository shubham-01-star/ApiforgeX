// Defines the structure of the data our AI will generate

export interface Field {
  name: string;
  type: 'String' | 'Int' | 'Boolean' | 'DateTime' | 'Float';
  required?: boolean;
}

export interface Entity {
  name: string;
  fields: Field[];
}

// The complete blueprint for the user's project
export interface AppSchema {
  projectName: string;
  databaseType: 'postgresql' | 'mysql' | 'mongodb';
  entities: Entity[];
  additionalFiles?: { path: string, description: string }[];
}

export interface GithubComment {
  id: number;
  body: string;
  path: string;
  line: number; // Can be null for general comments, but Pr comments have it
  user: string;
  created_at: string;
}
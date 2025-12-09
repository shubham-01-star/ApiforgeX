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
}
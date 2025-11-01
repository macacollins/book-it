#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

// Types for OpenAPI specification
interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: { [path: string]: PathItem };
  components?: {
    schemas?: { [name: string]: Schema };
  };
}

interface PathItem {
  [method: string]: Operation;
}

interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: { [statusCode: string]: Response };
  security?: SecurityRequirement[];
}

interface Parameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required?: boolean;
  schema: Schema;
  description?: string;
  example?: any;
}

interface RequestBody {
  content: { [mediaType: string]: MediaType };
  required?: boolean;
  description?: string;
}

interface Response {
  description: string;
  content?: { [mediaType: string]: MediaType };
  headers?: { [name: string]: Header };
}

interface MediaType {
  schema: Schema;
}

interface Header {
  schema: Schema;
}

interface Schema {
  type?: string;
  format?: string;
  enum?: string[];
  items?: Schema;
  properties?: { [name: string]: Schema };
  required?: string[];
  additionalProperties?: boolean | Schema;
  $ref?: string;
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  description?: string;
  example?: any;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
}

interface SecurityRequirement {
  [name: string]: string[];
}

class OpenAPIToTypeScriptGenerator {
  private spec: OpenAPISpec;
  private generatedTypes = new Set<string>();
  private imports = new Set<string>();

  constructor(spec: OpenAPISpec) {
    this.spec = spec;
  }

  generate(): string {
    const typeDefinitions = this.generateTypeDefinitions();
    const clientClass = this.generateClientClass();

    return `// Generated TypeScript client for ${this.spec.info.title}
// Version: ${this.spec.info.version}
// Auto-generated from OpenAPI specification

${Array.from(this.imports).join("\n")}

${typeDefinitions}

${clientClass}
`;
  }

  private generateTypeDefinitions(): string {
    if (!this.spec.components?.schemas) {
      return "";
    }

    const types: string[] = [];

    for (const [name, schema] of Object.entries(this.spec.components.schemas)) {
      types.push(this.generateTypeFromSchema(name, schema));
    }

    return types.join("\n\n");
  }

  private generateTypeFromSchema(name: string, schema: Schema): string {
    if (this.generatedTypes.has(name)) {
      return "";
    }
    this.generatedTypes.add(name);

    if (schema.$ref) {
      return `export type ${name} = ${this.resolveRef(schema.$ref)};`;
    }

    if (schema.enum) {
      const enumValues = schema.enum.map((value) => `'${value}'`).join(" | ");
      return `export type ${name} = ${enumValues};`;
    }

    if (schema.type === "object" && schema.properties) {
      const properties: string[] = [];
      const required = schema.required || [];

      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const isRequired = required.includes(propName);
        const propType = this.getTypeScriptType(propSchema);
        const optional = isRequired ? "" : "?";
        const description = propSchema.description
          ? `  /** ${propSchema.description} */\n`
          : "";
        properties.push(`${description}  ${propName}${optional}: ${propType};`);
      }

      if (schema.additionalProperties) {
        const additionalType =
          schema.additionalProperties === true
            ? "any"
            : this.getTypeScriptType(schema.additionalProperties as Schema);
        properties.push(`  [key: string]: ${additionalType};`);
      }

      const description = schema.description
        ? `/** ${schema.description} */\n`
        : "";
      return `${description}export interface ${name} {
${properties.join("\n")}
}`;
    }

    if (schema.type === "array" && schema.items) {
      const itemType = this.getTypeScriptType(schema.items);
      return `export type ${name} = ${itemType}[];`;
    }

    return `export type ${name} = ${this.getTypeScriptType(schema)};`;
  }

  private getTypeScriptType(schema: Schema): string {
    if (schema.$ref) {
      return this.resolveRef(schema.$ref);
    }

    if (schema.enum) {
      return schema.enum.map((value) => `'${value}'`).join(" | ");
    }

    if (schema.allOf) {
      return schema.allOf.map((s) => this.getTypeScriptType(s)).join(" & ");
    }

    if (schema.oneOf || schema.anyOf) {
      const schemas = schema.oneOf || schema.anyOf || [];
      return schemas.map((s) => this.getTypeScriptType(s)).join(" | ");
    }

    switch (schema.type) {
      case "string":
        return "string";
      case "number":
      case "integer":
        return "number";
      case "boolean":
        return "boolean";
      case "array":
        if (schema.items) {
          return `${this.getTypeScriptType(schema.items)}[]`;
        }
        return "any[]";
      case "object":
        if (schema.properties) {
          const properties: string[] = [];
          const required = schema.required || [];

          for (const [propName, propSchema] of Object.entries(
            schema.properties,
          )) {
            const isRequired = required.includes(propName);
            const propType = this.getTypeScriptType(propSchema);
            const optional = isRequired ? "" : "?";
            properties.push(`${propName}${optional}: ${propType}`);
          }

          return `{ ${properties.join("; ")} }`;
        }
        if (schema.additionalProperties) {
          const valueType =
            schema.additionalProperties === true
              ? "any"
              : this.getTypeScriptType(schema.additionalProperties as Schema);
          return `{ [key: string]: ${valueType} }`;
        }
        return "object";
      default:
        return "any";
    }
  }

  private resolveRef(ref: string): string {
    // Extract type name from #/components/schemas/TypeName
    const parts = ref.split("/");
    return parts[parts.length - 1];
  }

  private generateClientClass(): string {
    const methods: string[] = [];

    for (const [pathPattern, pathItem] of Object.entries(this.spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (
          ["get", "post", "put", "patch", "delete"].includes(
            method.toLowerCase(),
          )
        ) {
          methods.push(
            this.generateMethod(pathPattern, method.toLowerCase(), operation),
          );
        }
      }
    }

    return `export class LichessClient {
  private baseURL: string;
  private authToken?: string;

  constructor(baseURL: string = 'https://lichess.org', authToken?: string) {
    this.baseURL = baseURL;
    this.authToken = authToken;
  }

  private async makeRequest<T>(
    path: string,
    method: string = 'GET',
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const url = \`\${this.baseURL}\${path}\`;
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.authToken) {
      requestHeaders['Authorization'] = \`Bearer \${this.authToken}\`;
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as unknown as T;
  }

${methods.join("\n\n")}
}`;
  }

  private generateMethod(
    pathPattern: string,
    method: string,
    operation: Operation,
  ): string {
    const methodName =
      operation.operationId || this.generateMethodName(pathPattern, method);
    const pathParams = this.extractPathParameters(pathPattern);
    const queryParams =
      operation.parameters?.filter((p) => p.in === "query") || [];
    const headerParams =
      operation.parameters?.filter((p) => p.in === "header") || [];

    // Generate parameter interface
    const params: string[] = [];
    const paramInterface: string[] = [];

    // Path parameters (required)
    for (const param of pathParams) {
      const pathParam = operation.parameters?.find(
        (p) => p.name === param && p.in === "path",
      );
      if (pathParam) {
        const paramType = this.getTypeScriptType(pathParam.schema);
        params.push(`${param}: ${paramType}`);
      }
    }

    // Query and header parameters
    if (queryParams.length > 0 || headerParams.length > 0) {
      for (const param of [...queryParams, ...headerParams]) {
        const paramType = this.getTypeScriptType(param.schema);
        const optional = param.required ? "" : "?";
        paramInterface.push(`${param.name}${optional}: ${paramType}`);
      }

      if (paramInterface.length > 0) {
        params.push(
          `options${queryParams.every((p) => !p.required) && headerParams.every((p) => !p.required) ? "?" : ""}: { ${paramInterface.join("; ")} }`,
        );
      }
    }

    // Request body
    if (operation.requestBody) {
      const jsonContent = operation.requestBody.content["application/json"];
      if (jsonContent) {
        const bodyType = this.getTypeScriptType(jsonContent.schema);
        const optional = operation.requestBody.required ? "" : "?";
        params.push(`body${optional}: ${bodyType}`);
      }
    }

    // Response type
    const responseType = this.getResponseType(operation);

    // Generate method body
    let path = pathPattern;
    for (const param of pathParams) {
      path = path.replace(`{${param}}`, `\${${param}}`);
    }

    const queryStringBuilder =
      queryParams.length > 0
        ? `
    const queryParams = new URLSearchParams();
    ${queryParams
      .map((p) => {
        const optional = p.required ? "" : "options?.";
        return `if (${optional}${p.name} !== undefined) queryParams.append('${p.name}', String(${optional}${p.name}));`;
      })
      .join("\n    ")}
    const queryString = queryParams.toString();
    const fullPath = queryString ? \`${path}?\${queryString}\` : '${path}';`
        : `
    const fullPath = '${path}';`;

    const headerBuilder =
      headerParams.length > 0
        ? `
    const headers: Record<string, string> = {};
    ${headerParams
      .map((p) => {
        const optional = p.required ? "" : "options?.";
        return `if (${optional}${p.name} !== undefined) headers['${p.name}'] = String(${optional}${p.name});`;
      })
      .join("\n    ")}`
        : `
    const headers: Record<string, string> = {};`;

    const bodyParam = operation.requestBody ? ", body" : "";

    const description = operation.description
      ? `  /**\n   * ${operation.summary || ""}\n   * ${operation.description.replace(/\n/g, "\n   * ")}\n   */\n`
      : "";

    return `${description}  async ${methodName}(${params.join(", ")}): Promise<${responseType}> {${queryStringBuilder}${headerBuilder}
    return this.makeRequest<${responseType}>(fullPath, '${method.toUpperCase()}'${bodyParam}, headers);
  }`;
  }

  private extractPathParameters(path: string): string[] {
    const matches = path.match(/\{([^}]+)\}/g);
    return matches ? matches.map((match) => match.slice(1, -1)) : [];
  }

  private generateMethodName(path: string, method: string): string {
    // Convert path like "/api/users/{id}/games" to "getUserGames"
    const parts = path.split("/").filter((part) => part && part !== "api");
    const cleanParts = parts.map((part) => {
      if (part.startsWith("{") && part.endsWith("}")) {
        return "By" + this.capitalize(part.slice(1, -1));
      }
      return this.capitalize(part);
    });

    return method + cleanParts.join("");
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getResponseType(operation: Operation): string {
    const okResponse = operation.responses["200"] || operation.responses["201"];
    if (!okResponse?.content) {
      return "void";
    }

    const jsonContent =
      okResponse.content["application/json"] ||
      okResponse.content["application/x-ndjson"] ||
      Object.values(okResponse.content)[0];

    if (jsonContent?.schema) {
      return this.getTypeScriptType(jsonContent.schema);
    }

    return "any";
  }
}

// Main execution
function main() {
  const specPath = process.argv[2] || "lichess-openapi.json";
  const outputPath = process.argv[3] || "lichess-client.ts";

  if (!fs.existsSync(specPath)) {
    console.error(`OpenAPI spec file not found: ${specPath}`);
    process.exit(1);
  }

  try {
    const specContent = fs.readFileSync(specPath, "utf8");
    const spec: OpenAPISpec = JSON.parse(specContent);

    const generator = new OpenAPIToTypeScriptGenerator(spec);
    const clientCode = generator.generate();

    fs.writeFileSync(outputPath, clientCode);
    console.log(`Generated TypeScript client: ${outputPath}`);
  } catch (error) {
    console.error("Error generating client:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { OpenAPIToTypeScriptGenerator };

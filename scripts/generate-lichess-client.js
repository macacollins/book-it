#!/usr/bin/env node

// Simple JavaScript runner for the TypeScript generator
const fs = require("fs");
const path = require("path");

// Read and parse the OpenAPI spec
const specPath = path.join(__dirname, "../features/lichess-openapi.json");
const outputPath = path.join(
  __dirname,
  "../src/integrations/lichess-client.ts",
);

if (!fs.existsSync(specPath)) {
  console.error(`OpenAPI spec file not found: ${specPath}`);
  process.exit(1);
}

try {
  console.log("Reading OpenAPI specification...");
  const specContent = fs.readFileSync(specPath, "utf8");
  const spec = JSON.parse(specContent);

  console.log(`Loaded spec: ${spec.info.title} v${spec.info.version}`);
  console.log(`Found ${Object.keys(spec.paths || {}).length} API paths`);
  console.log(
    `Found ${Object.keys(spec.components?.schemas || {}).length} schema components`,
  );

  // Generate the client code
  const clientCode = generateLichessClient(spec);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, clientCode);
  console.log(`Generated TypeScript client: ${outputPath}`);
  console.log(`Generated ${clientCode.split("\n").length} lines of code`);
} catch (error) {
  console.error("Error generating client:", error);
  process.exit(1);
}

function generateLichessClient(spec) {
  const generatedTypes = new Set();

  // Generate type definitions
  const typeDefinitions = generateTypeDefinitions(spec, generatedTypes);

  // Generate client class
  const clientClass = generateClientClass(spec);

  return `// Generated TypeScript client for ${spec.info.title}
// Version: ${spec.info.version}
// Auto-generated from OpenAPI specification

${typeDefinitions}

${clientClass}
`;
}

function generateTypeDefinitions(spec, generatedTypes) {
  if (!spec.components?.schemas) {
    return "";
  }

  const types = [];

  for (const [name, schema] of Object.entries(spec.components.schemas)) {
    types.push(generateTypeFromSchema(name, schema, generatedTypes, spec));
  }

  return types.join("\n\n");
}

function generateTypeFromSchema(name, schema, generatedTypes, spec) {
  if (generatedTypes.has(name)) {
    return "";
  }
  generatedTypes.add(name);

  if (schema.$ref) {
    return `export type ${name} = ${resolveRef(schema.$ref)};`;
  }

  if (schema.enum) {
    const enumValues = schema.enum.map((value) => `'${value}'`).join(" | ");
    return `export type ${name} = ${enumValues};`;
  }

  if (schema.type === "object" && schema.properties) {
    const properties = [];
    const required = schema.required || [];

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const isRequired = required.includes(propName);
      const propType = getTypeScriptType(propSchema, spec);
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
          : getTypeScriptType(schema.additionalProperties, spec);
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
    const itemType = getTypeScriptType(schema.items, spec);
    return `export type ${name} = ${itemType}[];`;
  }

  return `export type ${name} = ${getTypeScriptType(schema, spec)};`;
}

function getTypeScriptType(schema, spec) {
  if (schema.$ref) {
    return resolveRef(schema.$ref);
  }

  if (schema.enum) {
    return schema.enum.map((value) => `'${value}'`).join(" | ");
  }

  if (schema.allOf) {
    return schema.allOf.map((s) => getTypeScriptType(s, spec)).join(" & ");
  }

  if (schema.oneOf || schema.anyOf) {
    const schemas = schema.oneOf || schema.anyOf || [];
    return schemas.map((s) => getTypeScriptType(s, spec)).join(" | ");
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
        return `${getTypeScriptType(schema.items, spec)}[]`;
      }
      return "any[]";
    case "object":
      if (schema.properties) {
        const properties = [];
        const required = schema.required || [];

        for (const [propName, propSchema] of Object.entries(
          schema.properties,
        )) {
          const isRequired = required.includes(propName);
          const propType = getTypeScriptType(propSchema, spec);
          const optional = isRequired ? "" : "?";
          properties.push(`${propName}${optional}: ${propType}`);
        }

        return `{ ${properties.join("; ")} }`;
      }
      if (schema.additionalProperties) {
        const valueType =
          schema.additionalProperties === true
            ? "any"
            : getTypeScriptType(schema.additionalProperties, spec);
        return `{ [key: string]: ${valueType} }`;
      }
      return "object";
    default:
      return "any";
  }
}

function resolveRef(ref) {
  // Extract type name from #/components/schemas/TypeName
  const parts = ref.split("/");
  return parts[parts.length - 1];
}

function generateClientClass(spec) {
  const methods = [];

  for (const [pathPattern, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (
        ["get", "post", "put", "patch", "delete"].includes(method.toLowerCase())
      ) {
        methods.push(
          generateMethod(pathPattern, method.toLowerCase(), operation, spec),
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
    
    const requestHeaders = {
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

function generateMethod(pathPattern, method, operation, spec) {
  const methodName =
    operation.operationId || generateMethodName(pathPattern, method);
  const pathParams = extractPathParameters(pathPattern);
  const queryParams =
    operation.parameters?.filter((p) => p.in === "query") || [];
  const headerParams =
    operation.parameters?.filter((p) => p.in === "header") || [];

  // Generate parameter interface
  const params = [];
  const paramInterface = [];

  // Path parameters (required)
  for (const param of pathParams) {
    const pathParam = operation.parameters?.find(
      (p) => p.name === param && p.in === "path",
    );
    if (pathParam) {
      const paramType = getTypeScriptType(pathParam.schema, spec);
      params.push(`${param}: ${paramType}`);
    }
  }

  // Query and header parameters
  if (queryParams.length > 0 || headerParams.length > 0) {
    for (const param of [...queryParams, ...headerParams]) {
      const paramType = getTypeScriptType(param.schema, spec);
      const optional = param.required ? "" : "?";
      paramInterface.push(`${param.name}${optional}: ${paramType}`);
    }

    if (paramInterface.length > 0) {
      const allOptional =
        queryParams.every((p) => !p.required) &&
        headerParams.every((p) => !p.required);
      params.push(
        `options${allOptional ? "?" : ""}: { ${paramInterface.join("; ")} }`,
      );
    }
  }

  // Request body
  if (operation.requestBody) {
    const jsonContent = operation.requestBody.content?.["application/json"];
    if (jsonContent) {
      const bodyType = getTypeScriptType(jsonContent.schema, spec);
      const optional = operation.requestBody.required ? "" : "?";
      params.push(`body${optional}: ${bodyType}`);
    }
  }

  // Response type
  const responseType = getResponseType(operation, spec);

  // Generate method body - handle path parameters properly
  let pathTemplate = pathPattern;
  for (const param of pathParams) {
    pathTemplate = pathTemplate.replace(`{${param}}`, `\${${param}}`);
  }

  const queryStringBuilder =
    queryParams.length > 0
      ? `
    const queryParams = new URLSearchParams();
    ${queryParams
      .map((p) => {
        const prefix = p.required ? "" : "options?.";
        return `if (${prefix}${p.name} !== undefined) queryParams.append('${p.name}', String(${prefix}${p.name}));`;
      })
      .join("\n    ")}
    const queryString = queryParams.toString();
    const fullPath = queryString ? \`${pathTemplate}?\${queryString}\` : \`${pathTemplate}\`;`
      : `
    const fullPath = \`${pathTemplate}\`;`;

  const headerBuilder =
    headerParams.length > 0
      ? `
    const headers: Record<string, string> = {};
    ${headerParams
      .map((p) => {
        const prefix = p.required ? "" : "options?.";
        return `if (${prefix}${p.name} !== undefined) headers['${p.name}'] = String(${prefix}${p.name});`;
      })
      .join("\n    ")}`
      : `
    const headers: Record<string, string> = {};`;

  const bodyParam = operation.requestBody ? ", body" : "";

  const description =
    operation.description || operation.summary
      ? `  /**\n   * ${(operation.summary || "").replace(/\n/g, " ")}\n   */\n`
      : "";

  return `${description}  async ${methodName}(${params.join(", ")}): Promise<${responseType}> {${queryStringBuilder}${headerBuilder}
    return this.makeRequest<${responseType}>(fullPath, '${method.toUpperCase()}'${bodyParam}, headers);
  }`;
}

function extractPathParameters(path) {
  const matches = path.match(/\{([^}]+)\}/g);
  return matches ? matches.map((match) => match.slice(1, -1)) : [];
}

function generateMethodName(path, method) {
  // Convert path like "/api/users/{id}/games" to "getUserGames"
  const parts = path.split("/").filter((part) => part && part !== "api");
  const cleanParts = parts.map((part) => {
    if (part.startsWith("{") && part.endsWith("}")) {
      return "By" + capitalize(part.slice(1, -1));
    }
    return capitalize(part);
  });

  return method + cleanParts.join("");
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getResponseType(operation, spec) {
  const okResponse =
    operation.responses?.["200"] || operation.responses?.["201"];
  if (!okResponse?.content) {
    return "void";
  }

  const jsonContent =
    okResponse.content["application/json"] ||
    okResponse.content["application/x-ndjson"] ||
    Object.values(okResponse.content)[0];

  if (jsonContent?.schema) {
    return getTypeScriptType(jsonContent.schema, spec);
  }

  return "any";
}

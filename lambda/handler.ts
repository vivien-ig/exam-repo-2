
import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

import { randomUUID } from "node:crypto";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const tableName = process.env.TABLE_NAME!;

export const handler = async (event: any) => {
  try {
    const method = event.httpMethod;
    const pathParameters = event.pathParameters;

    // POST /items - Insert an item
    if (method === "POST" && event.resource === "/items") {
      const body = JSON.parse(event.body || "{}");

      const item = {
         ...body,
        id: body.id || randomUUID(),
      };

      await dynamodb.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      );

      return {
        statusCode: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Item created successfully",
          item,
        }),
      };
    }

    // GET /items/{id} - Retrieve an item
    if (method === "GET" && event.resource === "/items/{id}") {
      const id = pathParameters?.id;

      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "id is required" }),
        };
      }

      const result = await dynamodb.send(
        new GetCommand({
          TableName: tableName,
          Key: { id },
        })
      );

      if (!result.Item) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Item not found" }),
        };
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.Item),
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Route not found" }),
    };
  } catch (error) {
    console.error("Request failed:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};

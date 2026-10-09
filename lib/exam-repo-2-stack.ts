
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ServerlessCdkAppStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // 1. DynamoDB table with id as the primary key
    const itemsTable = new dynamodb.Table(this, "ItemsTable", {
      tableName: "exam-items",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 2. IAM execution role for Lambda
    const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      description: "Execution role for the serverless API Lambda",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonDynamoDBFullAccess"
        ),
      ],
    });

    // 3. Lambda function
    const handler = new nodejs.NodejsFunction(this, "ItemsHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: "lambda/handler.ts",
      handler: "handler",
      role: lambdaRole,
      environment: {
        TABLE_NAME: itemsTable.tableName,
      },
    });

    // Explicitly grant read/write access to this table.
    // The FullAccess managed policy above is broader than necessary.
    itemsTable.grantReadWriteData(handler);

    // 4. API Gateway REST API
    const api = new apigateway.RestApi(this, "ItemsApi", {
      restApiName: "Exam Items Service",
      description: "REST API for inserting and retrieving DynamoDB items",
      deployOptions: {
        stageName: "prod",
      },
    });

    // POST /items
    const items = api.root.addResource("items");
    items.addMethod(
      "POST",
      new apigateway.LambdaIntegration(handler)
    );

    // GET /items/{id}
    const item = items.addResource("{id}");
    item.addMethod(
      "GET",
      new apigateway.LambdaIntegration(handler)
    );

    // 5. Output API URL
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "Base URL of the deployed REST API",
    });

    new cdk.CfnOutput(this, "DynamoDBTableName", {
      value: itemsTable.tableName,
    });
  }
}

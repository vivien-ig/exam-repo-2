

import * as cdk from "aws-cdk-lib";
import { ServerlessCdkAppStack } from "../lib/exam-repo-2-stack";

const app = new cdk.App();

new ServerlessCdkAppStack(app, "ServerlessCdkAppStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "ca-central-1",
  },
});

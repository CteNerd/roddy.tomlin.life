import { App } from "aws-cdk-lib";
import { configuration } from "./config.ts";
import { FounderStack } from "./stack.ts";

const app = new App();
new FounderStack(app, configuration(app.node.tryGetContext("environment"), app.node.tryGetContext("account")));

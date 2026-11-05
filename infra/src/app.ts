import { App } from "aws-cdk-lib";
import { configuration } from "./config.ts";
import { FounderStack } from "./stack.ts";
import { GovernanceStack } from "./governance.ts";
import { EventingStack } from "./eventing.ts";

const app = new App();
const config = configuration(app.node.tryGetContext("environment"), app.node.tryGetContext("account"));
const component: unknown = app.node.tryGetContext("component");
if (component === undefined || component === "foundation") new FounderStack(app, config);
else if (component === "governance") new GovernanceStack(app, config);
else if (component === "eventing") new EventingStack(app, config);
else throw new Error("component must be foundation, governance or eventing");

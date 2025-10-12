#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RolloutStack } from './rollout-stack';
import { ReplicationStack } from './replication-stack';

const app = new cdk.App();
const account = process.env.CDK_DEFAULT_ACCOUNT;

// Primary stack (us-west-2)
new RolloutStack(app, 'RolloutStack', {
  env: { account, region: 'us-west-2' },
});

// Destination bucket for S3 cross-region replication (us-east-1)
new ReplicationStack(app, 'RolloutReplicationStack', {
  env: { account, region: 'us-east-1' },
});



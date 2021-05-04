#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { IsolatedNetworkExperimentStack } from '../lib/isolated_network_experiment-stack';

const app = new cdk.App();
new IsolatedNetworkExperimentStack(app, 'IsolatedNetworkExperimentStack');

import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import IsolatedNetworkExperiment = require('../lib/isolated_network_experiment-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new IsolatedNetworkExperiment.IsolatedNetworkExperimentStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});

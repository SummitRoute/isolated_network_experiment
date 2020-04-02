import * as cdk from '@aws-cdk/core';
const iam = require('@aws-cdk/aws-iam');
const ec2 = require('@aws-cdk/aws-ec2');
const s3 = require('@aws-cdk/aws-s3');
const sqs = require('@aws-cdk/aws-sqs');


export class IsolatedNetworkExperimentStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC and subnet
    const vpc = new ec2.Vpc(this, 'vpc', {
      cidr: "10.0.0.0/24",
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.ISOLATED
        }
      ]
    });

    // Create VPC interface endpoints
    vpc.addInterfaceEndpoint('sqs', {
      service: ec2.InterfaceVpcEndpointAwsService.SQS
      // Default policy is Allow * on * from *, which we want for this demo.
    });

    vpc.addInterfaceEndpoint('SSM', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
    });

    vpc.addInterfaceEndpoint('ssm_messages', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES
    });

    vpc.addInterfaceEndpoint('ec2_messages', {
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES
    });

    // Create VPC Gateway Endpoint to S3
    vpc.addS3Endpoint('s3', [{subnetType: ec2.SubnetType.ISOLATED}]);

    // Create IAM Role for EC2
    const ec2_role = new iam.Role(this, "IsolatedEC2", {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      inlinePolicies: {
        inline: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['sqs:*'],
              resources: ["*"]
            }),
            new iam.PolicyStatement({
              actions: ['s3:*'],
              resources: ["*"]
            })
          ]
        })},
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')]
    });

    // Create EC2
    const isolated_ec2 = new ec2.Instance(this, "ec2", {
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: new ec2.AmazonLinuxImage({generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2}),
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({subnetType: ec2.SubnetType.ISOLATED}),
      // Requiring IMDSv2 is not yet possible with the CDK. Waiting on https://github.com/aws/aws-cdk/issues/5137
      role: ec2_role
    });

    // Create SQS
    const queue = new sqs.Queue(this, 'queue');

    // Create S3 bucket
    // This get's randomly named as something like `isolatednetworkexperimentstack-bucket43879c90-28dp1zfygem56`
    const bucket = new s3.Bucket(this, 'bucket');

    const access_point = new s3.CfnAccessPoint(this, 'accesspoint', {
      name: 'isolatedaccesspoint',
      bucket: bucket.bucketName,
      vpcConfiguration: {vpcId: vpc.vpcId},
    });
  }
}

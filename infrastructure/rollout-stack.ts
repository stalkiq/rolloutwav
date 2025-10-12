import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class RolloutStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket for hosting the static website
    const websiteBucket = new s3.Bucket(this, 'RolloutWebsiteBucket', {
      bucketName: `rollout-app-${this.account}-${this.region}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true, // Allow public read for static website hosting
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change for production
      autoDeleteObjects: true, // For development - change for production
    });

    // Domain and certificate (custom domain)
    const rootDomain = 'rolloutwav.com';
    let hostedZone: route53.IHostedZone | undefined;
    try {
      hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', { domainName: rootDomain });
    } catch {}
    const certificate = hostedZone
      ? new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
          domainName: rootDomain,
          subjectAlternativeNames: [`www.${rootDomain}`],
          hostedZone,
          region: 'us-east-1', // CloudFront requires us-east-1 certs
        })
      : undefined;

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'RolloutDistribution', {
      defaultBehavior: {
        origin: new origins.S3StaticWebsiteOrigin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      domainNames: certificate ? [rootDomain, `www.${rootDomain}`] : undefined,
      certificate,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
      comment: 'Rollout App Distribution',
    });

    // Deploy the built Next.js app to S3
    new s3deploy.BucketDeployment(this, 'RolloutDeployment', {
      sources: [s3deploy.Source.asset('./out')], // We'll build to 'out' directory
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // === Backend: Auth ===
    const userPool = new cognito.UserPool(this, 'RolloutUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      passwordPolicy: { minLength: 8, requireLowercase: false, requireDigits: true, requireUppercase: false, requireSymbols: false },
      standardAttributes: { email: { required: true, mutable: false } },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });
    const domainPrefix = `rollout-${this.account}-${this.region}`.toLowerCase();
    const userPoolDomain = new cognito.UserPoolDomain(this, 'RolloutUserPoolDomain', {
      userPool,
      cognitoDomain: { domainPrefix },
    });
    const callbackUrls = [
      `https://${distribution.distributionDomainName}/auth/callback/`,
      ...(certificate ? [`https://${rootDomain}/auth/callback/`, `https://www.${rootDomain}/auth/callback/`] : []),
      'http://localhost:9002/auth/callback/'
    ];
    const logoutUrls = [
      `https://${distribution.distributionDomainName}/`,
      ...(certificate ? [`https://${rootDomain}/`, `https://www.${rootDomain}/`] : []),
      'http://localhost:9002/'
    ];
    const userPoolClient = new cognito.UserPoolClient(this, 'RolloutUserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: { userSrp: true, userPassword: true },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls,
        logoutUrls,
      },
    });

    // Identity pool for scoped S3 access (optional wiring now)
    const identityPool = new cognito.CfnIdentityPool(this, 'RolloutIdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{ clientId: userPoolClient.userPoolClientId, providerName: userPool.userPoolProviderName }],
    });

    // === Backend: Data ===
    const table = new dynamodb.Table(this, 'RolloutTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      replicationRegions: ['us-east-1'],
    });
    table.addGlobalSecondaryIndex({ indexName: 'GSI1', partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING }, sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING } });

    // === Backend: Private media bucket ===
    const mediaBucket = new s3.Bucket(this, 'RolloutMediaBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CORS for browser uploads via presigned URLs
    mediaBucket.addCorsRule({
      allowedOrigins: [
        `https://${distribution.distributionDomainName}`,
        ...(certificate ? [`https://${rootDomain}`, `https://www.${rootDomain}`] : []),
        'http://localhost:9002',
      ],
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.HEAD],
      allowedHeaders: ['*'],
      exposedHeaders: ['ETag'],
      maxAge: 3000,
    });

    // Lifecycle to reduce cost
    mediaBucket.addLifecycleRule({
      abortIncompleteMultipartUploadAfter: cdk.Duration.days(3),
      noncurrentVersionExpiration: cdk.Duration.days(30),
      transitions: [
        { storageClass: s3.StorageClass.INFREQUENT_ACCESS, transitionAfter: cdk.Duration.days(30) },
        { storageClass: s3.StorageClass.GLACIER, transitionAfter: cdk.Duration.days(180) },
        { storageClass: s3.StorageClass.DEEP_ARCHIVE, transitionAfter: cdk.Duration.days(365) },
      ],
    });

    // CloudFront signed URLs could be added later. For now, presigned S3 URLs via API.

    // === Backend: Lambdas ===
    const commonEnv = {
      TABLE_NAME: table.tableName,
      MEDIA_BUCKET: mediaBucket.bucketName,
      USER_POOL_ID: userPool.userPoolId,
      REGION: this.region,
    };

    const nodeRuntime = lambda.Runtime.NODEJS_20_X;
    const lambdaMe = new lambda.Function(this, 'MeFunction', {
      runtime: nodeRuntime,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('services/api/me'),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(10),
    });

    const lambdaAlbums = new lambda.Function(this, 'AlbumsFunction', {
      runtime: nodeRuntime,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('services/api/albums'),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(15),
    });

    const lambdaProjects = new lambda.Function(this, 'ProjectsFunction', {
      runtime: nodeRuntime,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('services/api/projects'),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(15),
    });

    const lambdaPresign = new lambda.Function(this, 'PresignFunction', {
      runtime: nodeRuntime,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('services/api/presign'),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(10),
    });

    table.grantReadWriteData(lambdaAlbums);
    table.grantReadWriteData(lambdaProjects);
    table.grantReadData(lambdaMe);
    mediaBucket.grantReadWrite(lambdaPresign);

    // === Backend: API Gateway (HTTP API) ===
    const httpApi = new apigwv2.HttpApi(this, 'RolloutHttpApi', {
      apiName: 'rollout-api',
      corsPreflight: { allowOrigins: ['*'], allowMethods: [apigwv2.CorsHttpMethod.ANY], allowHeaders: ['*'] },
    });
    const userPoolAuthorizer = new authorizers.HttpUserPoolAuthorizer('RolloutAuthorizer', userPool, {
      userPoolClients: [userPoolClient],
    });
    httpApi.addRoutes({ path: '/me', methods: [apigwv2.HttpMethod.GET], integration: new integrations.HttpLambdaIntegration('MeIntegration', lambdaMe), authorizer: userPoolAuthorizer });
    httpApi.addRoutes({ path: '/albums', methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST, apigwv2.HttpMethod.PUT], integration: new integrations.HttpLambdaIntegration('AlbumsIntegration', lambdaAlbums), authorizer: userPoolAuthorizer });
    httpApi.addRoutes({ path: '/albums/{id}', methods: [apigwv2.HttpMethod.DELETE], integration: new integrations.HttpLambdaIntegration('AlbumsByIdIntegration', lambdaAlbums), authorizer: userPoolAuthorizer });
    httpApi.addRoutes({ path: '/projects', methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST], integration: new integrations.HttpLambdaIntegration('ProjectsIntegration', lambdaProjects), authorizer: userPoolAuthorizer });
    httpApi.addRoutes({ path: '/projects/{id}', methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.PUT, apigwv2.HttpMethod.DELETE], integration: new integrations.HttpLambdaIntegration('ProjectsByIdIntegration', lambdaProjects), authorizer: userPoolAuthorizer });
    httpApi.addRoutes({ path: '/uploads/presign', methods: [apigwv2.HttpMethod.POST], integration: new integrations.HttpLambdaIntegration('PresignIntegration', lambdaPresign), authorizer: userPoolAuthorizer });

    // Route53 aliases to CloudFront if hosted zone is found
    if (hostedZone) {
      new route53.ARecord(this, 'AliasRecordRoot', {
        zone: hostedZone,
        recordName: rootDomain,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      });
      new route53.ARecord(this, 'AliasRecordWWW', {
        zone: hostedZone,
        recordName: 'www',
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      });
    }

    // Output the CloudFront distribution URL
    new cdk.CfnOutput(this, 'DistributionURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });
    if (certificate) {
      new cdk.CfnOutput(this, 'CustomDomainURL', { value: `https://${rootDomain}`, description: 'Custom domain URL' });
    }

    // Output the S3 bucket name
    new cdk.CfnOutput(this, 'BucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'ApiUrl', { value: httpApi.apiEndpoint, description: 'HTTP API endpoint' });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'UserPoolDomain', { value: `https://${domainPrefix}.auth.${this.region}.amazoncognito.com` });
    new cdk.CfnOutput(this, 'MediaBucketName', { value: mediaBucket.bucketName });
  }
}

---
title: "Quick Start Guide"
description: "Get up and running with KeeperHub in minutes. Create your first blockchain automation workflow step by step."
---

# Quick Start Guide

Get up and running with KeeperHub in minutes by creating your first automation workflow.

## Step 1: Create Account

Visit app.keeperhub.com and sign up with your email address. A Para wallet is automatically created for your account, giving you a secure way to execute blockchain transactions.

## Step 2: Access Your Wallet

Click your profile icon in the top right and select **Wallet** to view your Para wallet address. Top up this wallet with ETH (on Mainnet or Sepolia testnet) to enable operations that require gas fees.

## Step 3: Create Your First Workflow

Click the workflow dropdown in the top left and select **New Workflow** to open the visual workflow builder.

### The Workflow Canvas

The workflow builder is a visual node-based editor where you build automations by connecting nodes:

- **Trigger Nodes**: Start your workflow (Scheduled, Webhook, Event, Block, Manual)
- **Action Nodes**: Perform operations (Check Balance, Send Email, Send Discord Message, etc.)
- **Condition Nodes**: Add branching logic based on results

### Adding Nodes

You can add nodes to your workflow in multiple ways:
- Click the **+** button in the top toolbar
- Right-click on the canvas to open the context menu
- Drag from an existing node's connector point

### Example: Wallet Balance Watcher

Let's create a workflow that monitors a wallet balance and sends notifications when it's low:

1. **Add a Scheduled Trigger**: Set it to run every 5 minutes
2. **Add a Check Balance node**: Configure it to check a wallet's ETH balance
3. **Add a Low Balance Condition**: Set a threshold (e.g., balance < 0.1 ETH)
4. **Add notification actions**: Connect Email and Discord nodes to alert when the condition is met

## Step 4: Configure Nodes

Click any node to open the configuration panel on the right side:

### For Web3 Actions (like Check Balance):
- **Service**: Select the service type (Web3)
- **Connection**: Choose your connected wallet
- **Network**: Select Sepolia Testnet or Ethereum Mainnet
- **Address**: Enter the wallet or contract address to monitor
- **Label**: Give your node a descriptive name
- **Description**: Optional notes about what this node does

### For Notification Actions:
- **Connection**: Select or create a connection (Email, Discord, Slack)
- **Message**: Configure the notification content

## Step 5: Set Up Connections

Before using notification actions, configure your connections:

1. Click your profile icon and select **Connections**
2. Add connections for the services you want to use:
   - **Email**: Configure email delivery
   - **Discord**: Add your Discord webhook URL
   - **Slack**: Connect your Slack workspace

## Step 6: Enable and Run

1. Click the **Enabled** toggle on each node you want active
2. Click the green **Run** button in the top toolbar to test your workflow
3. Your workflow will now execute based on the trigger configuration

## Using AI to Build Workflows

KeeperHub includes an AI assistant to help you build workflows. Click the **Ask AI...** input at the bottom of the canvas and describe what you want to automate in plain language.

Example prompts:
- "Monitor my wallet and alert me on Discord if balance drops below 0.5 ETH"
- "Check a smart contract function every hour and send an email with the result"

## What's Next

- Explore the **Hub** to discover and import workflow templates from the community
- Learn about [Workflow Examples](/workflows/examples) for more complex automation patterns
- Review [Security Best Practices](/practices/security) before deploying to Mainnet



---
title: "Workflows API"
description: "KeeperHub Workflows API - create, read, update, delete, and execute workflows."
---

# Workflows API

Manage workflows programmatically.

## List Workflows

```http
GET /api/workflows
```

Returns all workflows for the authenticated user (session) or organization (API key).

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectId` | string | Optional. Filter workflows by project ID |
| `tagId` | string | Optional. Filter workflows by tag ID |

### Example

```http
GET /api/workflows?projectId=proj_123&tagId=tag_456
```

### Response

```json
[
  {
    "id": "wf_123",
    "name": "My Workflow",
    "description": "Monitors ETH balance",
    "visibility": "private",
    "nodes": [],
    "edges": [],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

## Get Workflow

```http
GET /api/workflows/{workflowId}
```

Returns a single workflow by ID.

### Response

```json
{
  "id": "wf_123",
  "name": "My Workflow",
  "description": "Monitors ETH balance",
  "visibility": "private",
  "nodes": [...],
  "edges": [...],
  "publicTags": [
    {
      "id": "tag_1",
      "name": "DeFi",
      "slug": "defi"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "isOwner": true
}
```

Public workflows include a `publicTags` array showing all assigned tags.

## Create Workflow

```http
POST /api/workflows/create
```

### Request Body

```json
{
  "name": "New Workflow",
  "description": "Optional description",
  "projectId": "proj_123"
}
```

The `projectId` field is optional. If provided, the workflow is assigned to the specified [project](/api/projects).

### Response

Returns the created workflow with a default trigger node and an empty action node connected to it.

## Update Workflow

```http
PATCH /api/workflows/{workflowId}
```

### Request Body

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "projectId": "proj_123",
  "tagId": "tag_456",
  "nodes": [...],
  "edges": [...],
  "visibility": "private"
}
```

The `tagId` field assigns the workflow to an organization tag for categorization.

## Delete Workflow

```http
DELETE /api/workflows/{workflowId}
```

Returns `409 Conflict` if the workflow has execution history. Use the `force` query parameter to cascade delete all runs and logs:

```http
DELETE /api/workflows/{workflowId}?force=true
```

## Execute Workflow

```http
POST /api/workflow/{workflowId}/execute
```

Manually trigger a workflow execution.

### Response

```json
{
  "executionId": "exec_123",
  "runId": "run_abc123",
  "status": "pending"
}
```

The `runId` identifies the workflow execution run and is stored in the workflow execution record.

## Webhook Trigger

```http
POST /api/workflows/{workflowId}/webhook
```

Trigger a workflow via webhook. Requires API key authentication.

## Duplicate Workflow

```http
POST /api/workflows/{workflowId}/duplicate
```

Creates a copy of an existing workflow.

## Download Workflow

```http
GET /api/workflows/{workflowId}/download
```

Download workflow definition as JSON.

## Generate Code

```http
GET /api/workflows/{workflowId}/code
```

Generate SDK code for the workflow.

## Claim Workflow

```http
POST /api/workflows/{workflowId}/claim
```

Claim an anonymous workflow into the authenticated user's organization. Only the original creator of the anonymous workflow can claim it.

## Publish Workflow (Go Live)

```http
PUT /api/workflows/{workflowId}/go-live
```

Publish a workflow to make it publicly visible with metadata and tags.

### Request Body

```json
{
  "name": "Public Workflow Name",
  "publicTagIds": ["tag_1", "tag_2"]
}
```

The `name` is required. `publicTagIds` is an array of public tag IDs to associate with the workflow (maximum 5 tags).

## List Public Workflows

```http
GET /api/workflows/public
```

Returns all public workflows with optional filtering.

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `featured` | boolean | Optional. Filter for featured workflows (`?featured=true`) |
| `featuredProtocol` | string | Optional. Filter for protocol-featured workflows (e.g., `?featuredProtocol=sky`) |
| `tag` | string | Optional. Filter by public tag slug (e.g., "defi", "nft") |

### Response

```json
[
  {
    "id": "wf_123",
    "name": "Public Workflow",
    "description": "Description",
    "nodes": [...],
    "edges": [...],
    "publicTags": [
      {
        "id": "tag_1",
        "name": "DeFi",
        "slug": "defi"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

## Workflow Taxonomy

```http
GET /api/workflows/taxonomy
```

Returns distinct categories and protocols from all public workflows. Useful for building filter UIs.

### Response

```json
{
  "categories": ["defi", "nft"],
  "protocols": ["uniswap", "aave-v3"]
}
```

## Update Featured Status (Internal)

```http
POST /api/hub/featured
```

Mark a workflow as featured in the hub. Requires internal service authentication (`hub` service). Accepts optional `category`, `protocol`, and `featuredOrder` fields alongside the `workflowId`.

---
title: "API Overview"
description: "KeeperHub REST API reference - authentication, endpoints, rate limits, and SDKs."
---

# API Overview

The KeeperHub API allows you to programmatically manage workflows, integrations, and executions.

## Base URL

```
https://app.keeperhub.com/api
```

## Authentication

API requests require authentication. Two methods are supported, but their accepted scope differs:

- **Session**: Browser-based authentication via Better Auth. Accepted on every endpoint.
- **API Key** (`kh_`): For programmatic access to organization-scoped endpoints (workflows, integrations, billing, organization management). Not accepted on user-account, wallet write, OAuth-account-bound, or per-user endpoints.

See [Authentication](/api/authentication) for the full scope.

## Response Format

All responses are returned as JSON with the following structure:

### Success Response
```json
{
  "data": { ... }
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Rate Limits

API requests are subject to rate limiting. Current limits:
- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated requests

## Available Endpoints

| Resource | Description |
|----------|-------------|
| [Workflows](/api/workflows) | Create, read, update, delete workflows |
| [Executions](/api/executions) | Monitor workflow execution status and logs |
| [Direct Execution](/api/direct-execution) | Execute blockchain transactions without workflows |
| [Analytics](/api/analytics) | Workflow performance metrics and gas usage tracking |
| [Integrations](/api/integrations) | Manage notification and service integrations |
| [Projects](/api/projects) | Organize workflows into projects |
| [Tags](/api/tags) | Label and categorize workflows |
| [Chains](/api/chains) | List supported blockchain networks |
| [User](/api/user) | User profile, preferences, and address book |
| [Organizations](/api/organizations) | Organization membership management |
| [API Keys](/api/api-keys) | Manage API keys for programmatic access |

## SDKs

Official SDKs are planned for future release. In the meantime, you can interact with the API directly using any HTTP client or library such as `fetch`, `axios`, or `requests`.

---
title: "Integrations API"
description: "KeeperHub Integrations API - manage notification providers and service connections."
---

# Integrations API

Manage integrations for notifications and external services.

## Supported Integration Types

| Type | Description |
|------|-------------|
| `discord` | Discord webhook notifications |
| `slack` | Slack workspace integration |
| `telegram` | Telegram bot messaging |
| `sendgrid` | Email via SendGrid |
| `resend` | Email via Resend |
| `safe` | Safe multisig API integration |
| `webhook` | Custom HTTP webhooks |
| `web3` | Web3 wallet connections |
| `ai-gateway` | AI service integrations |

## List Integrations

```http
GET /api/integrations
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by integration type |

### Response

```json
{
  "data": [
    {
      "id": "int_123",
      "name": "My Discord",
      "type": "discord",
      "isManaged": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

Note: Integration config is excluded from list responses for security.

## Get Integration

```http
GET /api/integrations/{integrationId}
```

Returns full integration details including configuration.

## Create Integration

```http
POST /api/integrations
```

### Request Body

```json
{
  "name": "My Slack Integration",
  "type": "slack",
  "config": {
    "webhookUrl": "https://hooks.slack.com/..."
  }
}
```

## Update Integration

```http
PUT /api/integrations/{integrationId}
```

### Request Body

```json
{
  "name": "Updated Name",
  "config": {
    "webhookUrl": "https://new-webhook-url..."
  }
}
```

## Delete Integration

```http
DELETE /api/integrations/{integrationId}
```

## Test Integration

```http
POST /api/integrations/{integrationId}/test
```

Tests the integration credentials and connectivity.

### Request Body (Optional)

```json
{
  "configOverrides": {
    "webhookUrl": "https://test-webhook-url..."
  }
}
```

The `configOverrides` field allows testing with temporary configuration values without modifying the saved integration.

### Response

```json
{
  "status": "success",
  "message": "Integration test successful"
}

---
title: "API Keys"
description: "KeeperHub API Keys - create and manage API keys for programmatic access."
---

# API Keys

Manage API keys for programmatic access to the KeeperHub API.

## Key Types

KeeperHub has two distinct key systems, managed at different endpoints. They are not interchangeable.

| Prefix | Scope | Managed at | Used for |
|--------|-------|------------|----------|
| `kh_` | Organization | `/api/keys` | REST API, MCP server, Claude Code plugin |
| `wfb_` | User | `/api/api-keys` | Webhook triggers |

For typical programmatic API access use organization (`kh_`) keys.

## Organization Keys (`kh_`)

Issued per-organization. Create them from Settings > API Keys > Organisation in the dashboard, or via the endpoints below.

### List Organization Keys

```http
GET /api/keys
```

Accepts session or API-key authentication. Returns non-revoked keys for the active organization.

#### Response

```json
[
  {
    "id": "key_123",
    "name": "Production Key",
    "keyPrefix": "kh_abc",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastUsedAt": "2024-01-15T12:00:00Z",
    "createdByName": "Jane Doe",
    "expiresAt": null
  }
]
```

The full key is never returned after creation.

### Create Organization Key

```http
POST /api/keys
```

**Session authentication required.** Cannot be invoked with an API key. Otherwise a leaked key could mint additional keys for the same organization.

#### Request Body

```json
{
  "name": "My API Key",
  "expiresAt": "2025-01-01T00:00:00Z"
}
```

`expiresAt` is optional. Omit for a non-expiring key.

#### Response

```json
{
  "id": "key_123",
  "name": "My API Key",
  "key": "kh_full_api_key_here",
  "keyPrefix": "kh_full_",
  "createdAt": "2024-01-01T00:00:00Z",
  "expiresAt": null
}
```

Copy the `key` value immediately. It is only shown once.

### Revoke Organization Key

```http
DELETE /api/keys/{keyId}
```

Soft-revokes the key. Subsequent requests with that key return `401`.

#### Response

```json
{
  "success": true
}
```

## User Keys (`wfb_`)

Issued per-user. Intended for webhook triggers, not for general REST API access.

### List User Keys

```http
GET /api/api-keys
```

Session authentication required.

### Create User Key

```http
POST /api/api-keys
```

Session authentication required.

#### Request Body

```json
{
  "name": "My Webhook Key"
}
```

### Delete User Key

```http
DELETE /api/api-keys/{keyId}
```

Session authentication required. Revokes the key. This action cannot be undone.

## Security Notes

- Keys are hashed with SHA256 before storage; only the prefix is kept for identification.
- Anonymous users cannot create API keys.
- Revoke compromised keys immediately.
- Store keys in environment variables, not in source code.
- Key creation and personal-key deletion require session authentication, so a leaked API key cannot mint or delete other keys.
```

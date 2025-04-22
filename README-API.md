# Hedera APIs Documentation

This documentation outlines all available API endpoints for interacting with the Hedera blockchain through our application.

## Base URL

All API requests should be prefixed with: `http://localhost:5000/api`

## Authentication

Currently, the APIs do not require authentication but use the system operator account configured in environment variables.

## API Endpoints

### Wallet and Account Management

#### Create a New Wallet

Creates a new Hedera account with initial balance.

- **URL**: `/identity/wallet`
- **Method**: `POST`
- **Request Body** (optional):
  ```json
  {
    "initialBalance": 10 // Optional, defaults to 10 HBAR
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "message": "Compte Hedera créé avec succès",
    "status": "SUCCESS",
    "transactionId": "0.0.5829208@1650382896.838458689",
    "hashscanUrl": "https://hashscan.io/testnet/tx/0.0.5829208@1650382896.838458689",
    "accountId": "0.0.123456",
    "privateKey": "302e020100300506032b6570042...",
    "publicKey": "302a300506032b6570032100..."
  }
  ```

#### Create Basic Account

Creates a new Hedera account with more control options.

- **URL**: `/identity/account`
- **Method**: `POST`
- **Request Body** (optional):
  ```json
  {
    "initialBalance": 10 // Optional, defaults to 10 HBAR
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "message": "Account created successfully",
    "status": "SUCCESS",
    "transactionId": "0.0.5829208@1650382896.838458689",
    "hashscanUrl": "https://hashscan.io/testnet/tx/0.0.5829208@1650382896.838458689",
    "accountId": "0.0.123456",
    "privateKey": "302e020100300506032b6570042...",
    "publicKey": "302a300506032b6570032100...",
    "initialBalance": "10 ℏ"
  }
  ```

#### Get Account Balance

Retrieves the HBAR and token balance for a Hedera account.

- **URL**: `/identity/balance?accountId=0.0.123456`
- **Method**: `GET`
- **Query Parameters**:
  - `accountId` (optional): The Hedera account ID to check. Defaults to the operator account.
- **Success Response**: `200 OK`
  ```json
  {
    "accountId": "0.0.123456",
    "hbarBalance": "10 ℏ",
    "tokens": {
      "0.0.789012": "1"
    }
  }
  ```

#### Get Account Info

Retrieves detailed information about a Hedera account.

- **URL**: `/identity/account-info?accountId=0.0.123456`
- **Method**: `GET`
- **Query Parameters**:
  - `accountId` (optional): The Hedera account ID to check. Defaults to the operator account.
- **Success Response**: `200 OK`
  ```json
  {
    "accountId": "0.0.123456",
    "contractAccountId": null,
    "key": "302a300506032b6570032100...",
    "balance": "10 ℏ",
    "receiverSignatureRequired": false,
    "expirationTime": "2023-05-06T21:09:51.000Z",
    "autoRenewPeriod": "7776000 s",
    "proxyAccountId": null,
    "proxyReceived": "0 tℏ",
    "maxAutomaticTokenAssociations": 0
  }
  ```

#### Get Simplified Account Balance

A simpler endpoint to just check account balances.

- **URL**: `/identity/account-balance`
- **Method**: `GET`
- **Success Response**: `200 OK`
  ```json
  {
    "hbar": "10 ℏ",
    "tokens": "0.0.789012=1"
  }
  ```

#### Transfer HBAR

Transfers HBAR from the operator account to another account.

- **URL**: `/identity/transfer`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "receiverAccount": "0.0.123456",
    "amount": 1.5 // Optional, defaults to 1 HBAR
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "message": "HBAR transferred successfully",
    "from": "0.0.5829208",
    "to": "0.0.123456",
    "amount": 1.5,
    "status": "SUCCESS",
    "transactionId": "0.0.5829208@1650382896.838458689",
    "hashscanUrl": "https://hashscan.io/testnet/tx/0.0.5829208@1650382896.838458689"
  }
  ```

### NFT Operations

#### Create ID with NFT

Creates a new Hedera account and mints an NFT representing an identity.

- **URL**: `/identity/id-nft`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "tokenName": "My Identity",
    "tokenSymbol": "MYID",
    "initialBalance": 10,
    "maxSupply": 250
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "account": {
      "status": "SUCCESS",
      "transactionId": "0.0.5829208@1650382896.838458689",
      "hashscanUrl": "https://hashscan.io/testnet/tx/0.0.5829208@1650382896.838458689",
      "accountId": "0.0.123456",
      "privateKey": "302e020100300506032b6570042...",
      "publicKey": "302a300506032b6570032100..."
    },
    "nft": {
      "tokenId": "0.0.789012",
      "tokenName": "My Identity",
      "tokenSymbol": "MYID",
      "supplyKey": "302e020100300506032b6570042...",
      "serialNumbers": ["1"],
      "associationStatus": "SUCCESS",
      "transferStatus": "SUCCESS"
    }
  }
  ```

#### Mint NFT

Mints a new NFT and associates it with an existing account.

- **URL**: `/identity/mint`
- **Method**: `POST`
- **Request Body** (optional):
  - Can be customized based on your application needs
- **Success Response**: `200 OK`
  ```json
  {
    "newAccountId": "0.0.123456",
    "publicKey": "302a300506032b6570032100...",
    "privateKey": "302e020100300506032b6570042...",
    "tokenId": "0.0.789012",
    "mintedSerials": ["1"]
  }
  ```

### Identity Management (MongoDB)

These endpoints interact with a MongoDB database for storing and retrieving identity information.

#### Get All Identities

Retrieves all identities stored in the database.

- **URL**: `/identity`
- **Method**: `GET`
- **Success Response**: `200 OK`
  ```json
  [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2023-05-01T14:48:00.000Z",
      "tokenId": "0.0.789012",
      "accountId": "0.0.123456"
    }
  ]
  ```

#### Get Identity by ID

Retrieves a specific identity by its MongoDB ID.

- **URL**: `/identity/:id`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: MongoDB ID of the identity
- **Success Response**: `200 OK`
  ```json
  {
    "_id": "60d21b4667d0d8992e610c85",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2023-05-01T14:48:00.000Z",
    "tokenId": "0.0.789012",
    "accountId": "0.0.123456"
  }
  ```

#### Create Identity with NFT

Creates a new identity in the database and mints an associated NFT.

- **URL**: `/identity`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "message": "NFT identité créée et mintée avec succès",
    "tokenId": "0.0.789012",
    "status": "SUCCESS",
    "identity": {
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2023-05-01T14:48:00.000Z"
    }
  }
  ```

#### Update Identity

Updates an existing identity in the database.

- **URL**: `/identity/:id`
- **Method**: `PATCH`
- **URL Parameters**:
  - `id`: MongoDB ID of the identity
- **Request Body**: Fields to update
  ```json
  {
    "firstName": "Jane"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "_id": "60d21b4667d0d8992e610c85",
    "firstName": "Jane",
    "lastName": "Doe",
    "createdAt": "2023-05-01T14:48:00.000Z",
    "tokenId": "0.0.789012",
    "accountId": "0.0.123456"
  }
  ```

#### Delete Identity

Deletes an identity from the database.

- **URL**: `/identity/:id`
- **Method**: `DELETE`
- **URL Parameters**:
  - `id`: MongoDB ID of the identity
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Identity deleted successfully"
  }
  ```

## Error Responses

All endpoints return appropriate error responses:

- **400 Bad Request**: Invalid parameters or body
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server or Hedera network errors

Example error response:

```json
{
  "error": "Error message details",
  "message": "User-friendly error message"
}
```

## Environment Setup

Make sure to configure the following environment variables:

```
MY_ACCOUNT_ID=0.0.XXXXX
MY_PRIVATE_KEY=XXXXX
MONGO_URI=mongodb://localhost:27017/hedera
PORT=5000
```

## Testing the API

You can test these endpoints using tools like:

- Postman
- cURL
- Insomnia
- Any HTTP client library

Example cURL request:

```bash
curl -X POST http://localhost:5000/api/identity/wallet \
  -H "Content-Type: application/json" \
  -d '{"initialBalance": 20}'
```

# Hedera Token API Documentation

This documentation describes the API endpoints for Hedera token operations. These controllers have been converted from standalone scripts into proper API endpoints with request/response handling.

## Authentication

All API endpoints are protected by authentication. You need to:

1. Register or login using `/api/auth` endpoints to get a JWT token
2. Include the JWT token in the Authorization header: `Authorization: Bearer YOUR_JWT_TOKEN`

## Token Operations API Endpoints

Base URL: `/api/token`

### Token Management

#### Associate Token

Associates a token with an account.

- **URL**: `/associate`
- **Method**: `POST`
- **Request Body**:

```json
{
  "accountId": "0.0.12345",
  "tokenId": "0.0.56789"
}
```

- **Response**:

```json
{
  "success": true,
  "data": {
    "status": "SUCCESS",
    "transactionId": "0.0.5829208@1587635821.776568892",
    "hashscanUrl": "https://hashscan.io/testnet/tx/0.0.5829208@1587635821.776568892"
  }
}
```

#### Burn Token

Burns a specific amount of tokens.

- **URL**: `/burn`
- **Method**: `POST`
- **Request Body**:

```json
{
  "tokenId": "0.0.56789",
  "amount": 100
}
```

- **Response**: Similar to the associate token response

#### Delete Token

Deletes a token entirely.

- **URL**: `/delete`
- **Method**: `POST`
- **Request Body**:

```json
{
  "tokenId": "0.0.56789"
}
```

- **Response**: Similar to the associate token response

#### Dissociate Token

Dissociates a token from an account.

- **URL**: `/dissociate`
- **Method**: `POST`
- **Request Body**:

```json
{
  "accountId": "0.0.12345",
  "tokenId": "0.0.56789"
}
```

- **Response**: Similar to the associate token response

#### Freeze Account

Freezes an account for a specific token.

- **URL**: `/freeze`
- **Method**: `POST`
- **Request Body**:

```json
{
  "accountId": "0.0.12345",
  "tokenId": "0.0.56789"
}
```

- **Response**: Similar to the associate token response

#### Pause Token

Pauses operations for a token.

- **URL**: `/pause`
- **Method**: `POST`
- **Request Body**:

```json
{
  "tokenId": "0.0.56789"
}
```

- **Response**: Similar to the associate token response

#### Unpause Token

Unpauses operations for a token.

- **URL**: `/unpause`
- **Method**: `POST`
- **Request Body**:

```json
{
  "tokenId": "0.0.56789"
}
```

- **Response**: Similar to the associate token response

#### Unfreeze Account

Unfreezes an account for a specific token.

- **URL**: `/unfreeze`
- **Method**: `POST`
- **Request Body**:

```json
{
  "accountId": "0.0.12345",
  "tokenId": "0.0.56789"
}
```

- **Response**: Similar to the associate token response

#### Wipe Token

Wipes a specific amount of tokens from an account.

- **URL**: `/wipe`
- **Method**: `POST`
- **Request Body**:

```json
{
  "accountId": "0.0.12345",
  "tokenId": "0.0.56789",
  "amount": 100
}
```

- **Response**: Similar to the associate token response

### NFT Operations

#### Deploy NFT Contract

Deploys a new NFT smart contract.

- **URL**: `/nft/deploy`
- **Method**: `POST`
- **Request Body**:

```json
{
  "bytecode": "0x60806040..."
}
```

- **Response**:

```json
{
  "success": true,
  "data": {
    "contractId": "0.0.12345"
  }
}
```

#### Create NFT Collection

Creates an NFT collection using a deployed contract.

- **URL**: `/nft/create`
- **Method**: `POST`
- **Request Body**:

```json
{
  "contractId": "0.0.12345",
  "name": "My NFT Collection",
  "symbol": "MNFT",
  "memo": "My first NFT collection",
  "maxSupply": 1000,
  "expiration": 7000000
}
```

- **Response**:

```json
{
  "success": true,
  "data": {
    "tokenId": "0.0.56789",
    "tokenIdSolidityAddress": "0x0000000000000000000000000000000000000123"
  }
}
```

#### Mint NFT

Mints a new NFT.

- **URL**: `/nft/mint`
- **Method**: `POST`
- **Request Body**:

```json
{
  "contractId": "0.0.12345",
  "tokenIdSolidityAddr": "0x0000000000000000000000000000000000000123",
  "metadata": "ipfs://bafyreie3ichmqul4xa7e6xcy34tylbuq2vf3gnjf7c55trg3b6xyjr4bku/metadata.json"
}
```

- **Response**:

```json
{
  "success": true,
  "data": {
    "serial": "1"
  }
}
```

#### Transfer NFT

Transfers an NFT to another account.

- **URL**: `/nft/transfer`
- **Method**: `POST`
- **Request Body**:

```json
{
  "contractId": "0.0.12345",
  "tokenIdSolidityAddr": "0x0000000000000000000000000000000000000123",
  "receiverAccountId": "0.0.56789",
  "serial": 1
}
```

- **Response**:

```json
{
  "success": true,
  "data": {
    "status": "SUCCESS"
  }
}
```

#### Create Account

Creates a new Hedera account.

- **URL**: `/account/create`
- **Method**: `POST`
- **Request Body**:

```json
{
  "initialBalance": 10
}
```

- **Response**:

```json
{
  "success": true,
  "data": {
    "accountId": "0.0.12345",
    "privateKey": "302e020100300506032b657004220420...",
    "publicKey": "302d300706052b8104000a032200..."
  }
}
```

#### Create and Transfer NFT (All-in-One)

Combine plusieurs opérations en une seule requête : déploiement du contrat, création de la collection NFT, minting de deux copies (avec le même ID mais des numéros de série différents), et transfert d'une copie vers un compte client. La première copie reste dans le compte du créateur.

- **URL**: `/nft/create-and-transfer`
- **Method**: `POST`
- **Request Body**:

```json
{
  "bytecode": "60806040...", // Optionnel, utilisera la valeur par défaut si non fourni
  "name": "Ma Collection NFT",
  "symbol": "MNFT",
  "memo": "Ma première collection NFT", // Optionnel
  "maxSupply": 1000, // Optionnel
  "expiration": 7000000, // Optionnel
  "metadata": "ipfs://bafyreie3ichmqul4xa7e6xcy34tylbuq2vf3gnjf7c55trg3b6xyjr4bku/metadata.json",
  "receiverAccountId": "0.0.56789"
}
```

- **Response**:

```json
{
  "success": true,
  "data": {
    "contractId": "0.0.12345",
    "tokenId": "0.0.56789",
    "creator": {
      "accountId": "0.0.5829208",
      "nftSerial": "1"
    },
    "receiver": {
      "accountId": "0.0.56789",
      "nftSerial": "2"
    },
    "transferStatus": "SUCCESS"
  }
}
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:

- 200: Success
- 400: Bad Request (missing or invalid parameters)
- 401: Unauthorized (missing or invalid authentication)
- 500: Internal Server Error (server-side error)

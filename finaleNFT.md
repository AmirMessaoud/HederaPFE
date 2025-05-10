# Educational Certificate NFT System (Updated)

## Overview

This system allows for the creation and minting of educational certificate NFTs on the Hedera Hashgraph network. Each certificate is represented as a non-fungible token (NFT) that is issued to both the recipient and the educational institution. The system creates two identical NFTs with the same metadata - one sent to the recipient and one to the institution for record-keeping purposes.

**NEW FEATURE**: The system now automatically retrieves private keys from the .env file based on the provided account IDs, making it more secure and easier to use.

## Features

- Mint educational certificate NFTs with detailed metadata
- Issue duplicate NFTs: one to the recipient and one to the institution
- Associate NFTs with Hedera accounts automatically using private keys from .env file
- Track certificate provenance on the Hedera network
- Immutable blockchain-based verification of academic credentials
- Improved error handling and transaction fee management
- Enhanced logging for tracking NFT creation and transfers

## Certificate Metadata Structure

Each certificate NFT contains the following metadata:

| Field                | Description                                                                |
| -------------------- | -------------------------------------------------------------------------- |
| UserAccountId        | Hedera account ID of the certificate recipient                             |
| InstitutionAccountId | Hedera account ID of the issuing institution                               |
| receipentName        | Full name of the certificate recipient                                     |
| certificateTitle     | Title of the certificate (e.g., "Bachelor of Science in Computer Science") |
| institutionName      | Name of the issuing educational institution                                |
| dateIssued           | Date when the certificate was issued                                       |
| grade                | Final grade or classification achieved                                     |
| speciality           | Area of specialization or major                                            |
| duration             | Duration of the study program                                              |
| issuerName           | Name of the individual who issued the certificate                          |

## Technical Implementation

The system uses:

- Hedera JavaScript SDK for blockchain interactions
- Smart contracts for NFT creation and management
- Environment variables (.env) for secure key management
- Automatic association of tokens with relevant accounts
- Transaction fee optimization to prevent negative fee errors

## Testing with Postman

### Endpoint

```
POST http://localhost:5000/api/nft/certif/create
```

### Headers

```
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

### Request Body Example

```json
{
  "categoryType": "Academic",
  "itemType": "Certificate",
  "metadata": {
    "UserAccountId": "0.0.5953673",
    "InstitutionAccountId": "0.0.5953682",
    "receipentName": "Jane Doe",
    "certificateTitle": "Bachelor of Computer Science",
    "institutionName": "University of Technology",
    "dateIssued": "2025-05-10",
    "grade": "A",
    "speciality": "Artificial Intelligence",
    "duration": "4 years",
    "issuerName": "Prof. John Smith"
  }
}
```

### Important Notes

1. **Account IDs**: Make sure the `UserAccountId` and `InstitutionAccountId` match accounts defined in your .env file (ACCOUNT_0_ID or ACCOUNT_1_ID).

2. **Private Keys**: The system will automatically retrieve the corresponding private keys from your .env file. If a match is not found, it will fall back to using the operator account.

3. **Response Structure**: The response will include information about both NFTs - one created for the recipient and one for the institution.

### Example Response

```json
{
  "success": true,
  "message": "Certificat NFT créé avec succès",
  "data": {
    "contractId": "0.0.XXXXX",
    "tokenId": "0.0.XXXXX",
    "nftInfo": {
      "userNft": {
        "serialNumber": "1",
        "currentOwner": "0.0.5953673",
        "transferStatus": "SUCCESS"
      },
      "institutionNft": {
        "serialNumber": "2",
        "currentOwner": "0.0.5953682",
        "transferStatus": "SUCCESS"
      }
    },
    "certificateMetadata": {
      "category": "Certificat",
      "certificateTitle": "Bachelor of Computer Science",
      "receipentName": "Jane Doe",
      "institutionName": "University of Technology",
      "dateIssued": "2025-05-10",
      "grade": "A",
      "speciality": "Artificial Intelligence",
      "duration": "4 years",
      "issuerName": "Prof. John Smith"
    },
    "originalAccounts": {
      "userAccountId": "0.0.5953673",
      "institutionAccountId": "0.0.5953682"
    },
    "createdAt": "2025-05-10T17:30:00.000Z"
  }
}
```

- Hedera Hashgraph blockchain for secure, immutable record-keeping
- Smart contracts for NFT creation and management
- Hedera Token Service (HTS) for token operations
- REST API for easy integration with existing systems

## API Usage

### Creating and Minting Educational Certificate NFTs

**Endpoint:** `POST /api/nft/education/create`

**Request Body:**

```json
{
  "categoryType": "Education",
  "itemType": "Certificate",
  "metadata": {
    "UserAccountId": "0.0.XXXXX",
    "InstitutionAccountId": "0.0.YYYYY",
    "studentName": "John Doe",
    "certificateTitle": "Bachelor of Science in Computer Science",
    "institutionName": "University of Example",
    "dateIssued": "2025-05-07",
    "grade": "A",
    "speciality": "Artificial Intelligence",
    "duration": "4 years",
    "issuerName": "Professor Smith"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "contractId": "0.0.ZZZZZ",
    "tokenId": "0.0.AAAAA",
    "userInfo": {
      "accountId": "0.0.XXXXX",
      "serialNumber": "1",
      "transferStatus": "SUCCESS"
    },
    "institutionInfo": {
      "accountId": "0.0.YYYYY",
      "serialNumber": "2",
      "transferStatus": "SUCCESS"
    },
    "certificateType": "Education",
    "metadata": { ... },
    "simplifiedMetadata": "ipfs://metadata/Education/Certificate",
    "createdAt": "2025-05-07T14:17:08+01:00"
  }
}
```

## How It Works

The system performs the following steps when creating educational certificate NFTs:

1. Validates all required metadata fields are present
2. Creates a smart contract on the Hedera network
3. Creates an NFT collection through this contract
4. Mints two identical NFTs with the certificate metadata
5. Associates the token with both the student and institution accounts
6. Transfers one NFT to the student account
7. Transfers the second NFT to the institution account
8. Returns details about both NFTs and their transfer status

## Prerequisites

- Node.js environment
- Hedera testnet or mainnet accounts
- Environment variables for Hedera account IDs and private keys
- Smart contract bytecode in environment variables
- MongoDB database for storing additional certificate information

## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables in a `.env` file:
   ```
   MY_ACCOUNT_ID=0.0.XXXXX
   MY_PRIVATE_KEY=your-private-key
   BYTECODE=your-contract-bytecode
   MONGO_URI=mongodb://localhost:27017/hedera
   ```
4. Start the server with `npm start`

## Security Considerations

- Private keys should be securely stored and never exposed
- For production use, implement proper authentication and authorization
- Consider using a secure environment variables management system
- All API endpoints are protected with authentication middleware

## Verification

Certificate authenticity can be verified by:

1. Checking the token on the Hedera network using the token ID and serial number
2. Verifying the metadata matches the expected certificate details
3. Confirming the issuing institution account ID is legitimate
4. Comparing the NFT held by the student with the one held by the institution

---

This implementation allows educational institutions to create verifiable, blockchain-backed certificates that can be easily shared and verified while maintaining the highest levels of security and immutability.

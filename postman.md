# Hedera API - Postman Guide

This guide provides instructions for using the NFT minting API with Postman for both Real Estate and Transportation categories.

## Base URL

```
http://localhost:3000/api
```

## NFT Endpoints

### Create and Mint NFT

**Endpoint:** `POST /nft/create-and-mint`

This endpoint handles the creation, minting, and transfer of an NFT with metadata based on the selected category and item type.

## Category: Real Estate

### House NFT

**Request Example:**

```json
{
  "categoryType": "Real Estate",
  "itemType": "House",
  "metadata": {
    "buyerAccountId": "0.0.5829208",
    "sellerAccountId": "0.0.5829210",
    "fullAddress": "123 Main Street, Tunis, Tunisia",
    "propertyType": "Residential",
    "surfaceArea": 150,
    "numberOfRooms": 4,
    "yearOfConstruction": 2010,
    "propertyCondition": "Excellent",
    "purchasePrice": 450000,
    "recipientAccountId": "0.0.5829215"
  }
}
```

**Required Fields:**

- `categoryType`: Must be "Real Estate"
- `itemType`: Must be "House"
- `metadata`: Object containing the following fields:
  - `buyerAccountId`: Hedera account ID of the buyer
  - `sellerAccountId`: Hedera account ID of the seller
  - `fullAddress`: Complete address of the property
  - `propertyType`: Type of property (e.g., "Residential", "Commercial")
  - `surfaceArea`: Surface area in square meters (m²)
  - `numberOfRooms`: Number of rooms in the property
  - `yearOfConstruction`: Year the property was built
  - `propertyCondition`: Condition of the property (e.g., "Excellent", "Good", "Fair")
  - `purchasePrice`: Purchase price in TND
  - `recipientAccountId`: (Optional) If provided, the NFT will be transferred to this account. If not provided, a new account will be created.

**Response Example:**

```json
{
  "success": true,
  "data": {
    "contractId": "0.0.5829300",
    "tokenId": "0.0.5829301",
    "serialNumber": "1",
    "recipientId": "0.0.5829215",
    "category": "Real Estate",
    "itemType": "House",
    "metadata": {
      "categoryType": "Real Estate",
      "itemType": "House",
      "buyerAccountId": "0.0.5829208",
      "sellerAccountId": "0.0.5829210",
      "fullAddress": "123 Main Street, Tunis, Tunisia",
      "propertyType": "Residential",
      "surfaceArea": 150,
      "numberOfRooms": 4,
      "yearOfConstruction": 2010,
      "propertyCondition": "Excellent",
      "purchasePrice": 450000
    },
    "simplifiedMetadata": "ipfs://metadata/Real Estate/House",
    "status": "SUCCESS",
    "createdAt": "2025-05-05T14:13:46.789Z"
  }
}
```

## Category: Transportation

### Car NFT

**Request Example:**

```json
{
  "categoryType": "Transportation",
  "itemType": "Car",
  "metadata": {
    "buyerAccountId": "0.0.5829208",
    "sellerAccountId": "0.0.5829210",
    "manufacturer": "Toyota",
    "model": "Corolla",
    "type": "Sedan",
    "enginePower": "132 HP",
    "purchasePrice": 75000,
    "recipientAccountId": "0.0.5829215"
  }
}
```

**Required Fields:**

- `categoryType`: Must be "Transportation"
- `itemType`: Can be "Car", "Motorcycle", "Truck", "Bicycle", or "Scooter"
- `metadata`: Object containing the following fields:
  - `buyerAccountId`: Hedera account ID of the buyer
  - `sellerAccountId`: Hedera account ID of the seller
  - `manufacturer`: Manufacturer of the vehicle
  - `model`: Model of the vehicle
  - `type`: Type of the vehicle
  - `enginePower`: Engine power of the vehicle
  - `purchasePrice`: Purchase price in TND
  - `recipientAccountId`: (Optional) If provided, the NFT will be transferred to this account. If not provided, a new account will be created.

**Response Example:**

```json
{
  "success": true,
  "data": {
    "contractId": "0.0.5829300",
    "tokenId": "0.0.5829301",
    "serialNumber": "1",
    "recipientId": "0.0.5829215",
    "category": "Transportation",
    "itemType": "Car",
    "metadata": {
      "categoryType": "Transportation",
      "itemType": "Car",
      "buyerAccountId": "0.0.5829208",
      "sellerAccountId": "0.0.5829210",
      "manufacturer": "Toyota",
      "model": "Corolla",
      "type": "Sedan",
      "enginePower": "132 HP",
      "purchasePrice": 75000
    },
    "simplifiedMetadata": "ipfs://metadata/Transportation/Car",
    "status": "SUCCESS",
    "createdAt": "2025-05-05T14:13:46.789Z"
  }
}
```

### Motorcycle NFT

**Request Example:**

```json
{
  "categoryType": "Transportation",
  "itemType": "Motorcycle",
  "metadata": {
    "buyerAccountId": "0.0.5829208",
    "sellerAccountId": "0.0.5829210",
    "manufacturer": "Honda",
    "model": "CBR 600RR",
    "type": "Sport",
    "enginePower": "118 HP",
    "purchasePrice": 45000
  }
}
```

## Error Responses

**Missing Required Fields:**

```json
{
  "success": false,
  "message": "Missing required fields: categoryType, itemType, or metadata"
}
```

**Missing Category-Specific Fields:**

```json
{
  "success": false,
  "message": "Missing required Real Estate House metadata fields"
}
```

```json
{
  "success": false,
  "message": "Missing required Transportation metadata fields"
}
```

**Invalid Category or Item Type:**

```json
{
  "success": false,
  "message": "Invalid categoryType or itemType"
}
```

**Server Error:**

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error message details"
}
```

## HBAR Transfer Endpoint

**Endpoint:** `POST /api/hbar/transfer`

This endpoint handles the transfer of HBAR from one account to another on the Hedera network.

**Request Example:**

```json
{
  "senderAccount": "0.0.5829208",
  "receiverAccount": "0.0.5829215",
  "amount": 10
}
```

**Required Fields:**

- `senderAccount`: Hedera account ID of the sender
- `receiverAccount`: Hedera account ID of the receiver
- `amount`: Amount of HBAR to transfer (defaults to 1 if not specified)

**Response Example:**

```json
{
  "success": true,
  "data": {
    "message": "HBAR transferred successfully",
    "from": "0.0.5829208",
    "to": "0.0.5829215",
    "amount": 10,
    "status": "SUCCESS",
    "transactionId": "0.0.5829208@1746586000.123456789",
    "hashscanUrl": "https://hashscan.io/testnet/tx/0.0.5829208@1746586000.123456789",
    "createdAt": "2025-05-05T21:51:19.789Z"
  }
}
```

**Error Response Examples:**

```json
{
  "success": false,
  "message": "Missing senderAccount or receiverAccount in request body"
}
```

```json
{
  "success": false,
  "message": "Amount must be a positive number"
}
```

```json
{
  "success": false,
  "message": "Failed to transfer HBAR",
  "error": "Error message details"
}
```

## Notes

1. If `recipientAccountId` is not provided in the metadata for NFT minting, a new account will be created and its private key will be included in the response.
2. All monetary values for NFTs are in Tunisian Dinar (TND).
3. Make sure your Hedera test accounts have enough HBAR to perform the transactions.
4. The HBAR transfer API uses the operator account's private key to sign the transaction, which means the operator account must have sufficient permissions to transfer HBAR from the sender account.

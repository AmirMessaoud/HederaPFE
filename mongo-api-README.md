# Guide d'utilisation des APIs MongoDB pour NFTs Hedera

Ce document explique comment utiliser les APIs qui récupèrent les clés privées depuis MongoDB pour créer et minter différents types de NFTs sur Hedera.

## Prérequis

1. **MongoDB** configuré avec une collection d'utilisateurs contenant les clés privées
2. **Postman** pour tester l'API

## Configuration de MongoDB

Assurez-vous que votre base de données MongoDB contient une collection d'utilisateurs au format suivant :

```json
{
  "accountId": "0.0.5953673", // ID de compte Hedera
  "privateKey": "votre_clé_privée_hedera" // Clé privée au format standard (avec ou sans préfixe 0x)
}
```

**Note**: Par défaut, l'application recherche cette information dans la collection `wallets`.

## Variables d'environnement

Configurez les variables d'environnement suivantes dans votre fichier `.env` :

```
MONGO_URI=mongodb://localhost:27017
DB_NAME=hedera
USER_COLLECTION=wallets
```

## Endpoints disponibles

Deux endpoints sont disponibles pour créer différents types de NFTs avec les clés MongoDB :

### 1. Certificat Académique (Mongo_SCNFT_Certif)

- **URL**: `http://localhost:5000/api/nft/certif/create-mongo`
- **Méthode**: POST
- **Description**: Crée un NFT de certificat académique avec clés privées depuis MongoDB

### 2. Transaction (Mongo_SCNFT_T)

- **URL**: `http://localhost:5000/api/nft/transaction/create-mongo`
- **Méthode**: POST
- **Description**: Crée des NFTs pour transactions (immobilier, véhicule) avec clés depuis MongoDB

## Test avec Postman

### Étapes

1. Ouvrez Postman
2. Créez une nouvelle requête POST vers `http://localhost:5000/api/nft/certif/create-mongo`
3. Ajoutez les headers suivants :
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer votre_jwt_token`

## Exemples de corps de requête

### 1. Pour les endpoints de certificats (certificat académique)

```json
{
  "categoryType": "Academic",
  "itemType": "Certificate",
  "metadata": {
    "UserAccountId": "0.0.5953673",
    "InstitutionAccountId": "0.0.5953682",
    "receipentName": "Jane Doe",
    "certificateTitle": "Master of Computer Science",
    "institutionName": "University of Innovation",
    "dateIssued": "2025-05-10",
    "grade": "A+",
    "speciality": "Blockchain Technology",
    "duration": "2 years",
    "issuerName": "Prof. Sarah Johnson"
  }
}
```

### 2. Pour l'endpoint de transaction (immobilier/véhicule)

```json
{
  "categoryType": "Real Estate",
  "itemType": "House",
  "metadata": {
    "UserAccountId": "0.0.5953673",
    "InstitutionAccountId": "0.0.5953682",
    "fullAddress": "123 Rue Principale, Paris, 75001, France",
    "propertyType": "Appartement",
    "surfaceArea": "75 m²",
    "numberOfRooms": "3",
    "yearOfConstruction": "2005",
    "propertyCondition": "Excellent",
    "purchasePrice": "350000 EUR"
  }
}
```

### Fonctionnement

1. L'API recherche les clés privées associées aux `UserAccountId` et `InstitutionAccountId` dans MongoDB
2. Si les clés sont trouvées, elles sont utilisées pour signer les transactions associant les tokens et transférant les NFTs
3. Si une clé n'est pas trouvée, l'API utilise la clé de l'opérateur (fallback) définie dans le fichier `.env`
4. Deux NFTs sont créés : un pour l'utilisateur et un pour l'institution

### Réponse attendue

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
      "certificateTitle": "Master of Computer Science",
      "receipentName": "Jane Doe",
      "institutionName": "University of Innovation",
      "dateIssued": "2025-05-10",
      "grade": "A+",
      "speciality": "Blockchain Technology",
      "duration": "2 years",
      "issuerName": "Prof. Sarah Johnson"
    },
    "originalAccounts": {
      "userAccountId": "0.0.5953673",
      "institutionAccountId": "0.0.5953682"
    },
    "createdAt": "2025-05-10T18:30:00.000Z"
  }
}
```

## Résolution des problèmes courants

### 1. Erreur d'authentification

Si vous obtenez une erreur d'authentification, vérifiez votre token JWT dans l'en-tête `Authorization`.

### 2. Erreur de clé privée

Si vous obtenez une erreur indiquant que les clés privées n'ont pas pu être récupérées depuis MongoDB :

- Vérifiez que votre connexion à MongoDB est active
- Vérifiez que les documents utilisateur existent dans la collection avec le bon format
- Assurez-vous que les IDs de compte fournis dans la requête correspondent exactement à ceux stockés dans MongoDB

### 3. Erreur de frais de transaction

Si vous rencontrez des erreurs de frais de transaction ("defaultMaxTransactionFee must be non-negative"), ne vous inquiétez pas. L'API est configurée pour gérer correctement les frais de transaction en :

- Définissant les frais de transaction pour chaque opération individuelle
- Utilisant des valeurs appropriées pour chaque type de transaction
- Évitant les problèmes liés à defaultMaxTransactionFee

### 4. Problèmes de signature invalide

Si vous rencontrez des erreurs de signature invalide :

- Vérifiez que les clés privées stockées dans MongoDB sont au bon format
- Assurez-vous qu'elles correspondent bien aux comptes Hedera indiqués

## Extensions possibles

Cette API peut être étendue pour prendre en charge d'autres types de métadonnées et d'NFTs en modifiant simplement la structure de la requête. Consultez les autres endpoints disponibles pour les différents types de certificats et de transactions.

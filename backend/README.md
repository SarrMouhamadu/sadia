# Salihate Clean Backend

Backend API pour l'application Salihate avec une architecture clean.

## Description

Ce projet est un backend RESTful API construit avec Node.js et Express, utilisant une architecture propre et modulaire.

## Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn
- MongoDB (local ou cloud)

## Installation

1. Clonez le repository
```bash
git clone <repository-url>
cd salihate-clean-backend
```

2. Installez les dépendances
```bash
npm install
```

3. Créez un fichier `.env` à la racine du projet
```bash
cp .env.example .env
```

4. Configurez vos variables d'environnement dans le fichier `.env`

## Scripts disponibles

- `npm start` - Démarre le serveur en mode production
- `npm run dev` - Démarre le serveur en mode développement avec nodemon
- `npm test` - Lance les tests
- `npm run lint` - Vérifie le code avec ESLint

## Structure du projet

```
src/
├── config/          # Configuration (base de données, etc.)
├── models/          # Modèles Mongoose
├── controllers/     # Logique métier
├── routes/          # Définition des routes
├── middlewares/     # Middlewares personnalisés
├── services/        # Services métier
├── utils/           # Utilitaires
├── docs/            # Documentation (Swagger)
└── server.js        # Point d'entrée
```

## API Documentation

La documentation Swagger est disponible à `/api-docs` une fois le serveur lancé.

## Contribution

Les contributions sont bienvenues !

## License

ISC

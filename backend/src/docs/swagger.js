const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Salihate Clean API',
            version: '1.0.0',
            description: `
## API Backend pour Salihate Clean

Cette API fournit tous les endpoints nécessaires pour gérer:
- **Authentification** - Inscription, connexion, gestion des tokens JWT
- **Travailleurs** - CRUD complet avec statistiques
- **Salaires** - Gestion mensuelle avec génération de bulletins PDF
- **Stock** - Catégories, produits, mouvements et alertes
- **Clients** - Gestion des contrats et paiements (Admin uniquement)
- **Dashboard** - Statistiques et notifications

### Rôles
- **ADMIN** - Accès complet à toutes les fonctionnalités
- **ASSISTANT** - Accès aux travailleurs, salaires et stock (pas aux clients)

### Authentification
L'API utilise JWT (JSON Web Tokens) avec:
- **Access Token** - Expire après 15 minutes
- **Refresh Token** - Expire après 7 jours
            `,
            contact: {
                name: 'Support Technique',
                email: process.env.COMPANY_EMAIL || 'support@salihate.com'
            },
            license: {
                name: 'Propriétaire',
                url: 'https://salihate.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Serveur de développement'
            },
            {
                url: 'https://api.salihate.com',
                description: 'Serveur de production'
            }
        ],
        tags: [
            { name: 'Auth', description: 'Authentification et gestion des utilisateurs' },
            { name: 'Workers', description: 'Gestion des travailleurs' },
            { name: 'Salaries', description: 'Gestion des salaires mensuels' },
            { name: 'Categories', description: 'Catégories de produits' },
            { name: 'Products', description: 'Gestion des produits' },
            { name: 'Stock', description: 'Mouvements de stock' },
            { name: 'Clients', description: 'Gestion des clients (Admin)' },
            { name: 'Payments', description: 'Paiements clients (Admin)' },
            { name: 'Dashboard', description: 'Tableau de bord et statistiques' },
            { name: 'Notifications', description: 'Système de notifications' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Entrez votre JWT token'
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Token d\'accès manquant ou invalide',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Non autorisé' }
                                }
                            }
                        }
                    }
                },
                ForbiddenError: {
                    description: 'Accès refusé - Permissions insuffisantes',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Accès refusé' }
                                }
                            }
                        }
                    }
                },
                NotFoundError: {
                    description: 'Ressource non trouvée',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Ressource non trouvée' }
                                }
                            }
                        }
                    }
                },
                ValidationError: {
                    description: 'Erreur de validation',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Erreur de validation' },
                                    errors: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                field: { type: 'string' },
                                                message: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/routes/**/*.js']
};

const swaggerDoc = swaggerJsdoc(options);

module.exports = swaggerDoc;

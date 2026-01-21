const { Notification } = require('../models');
const logger = require('../utils/logger');

class NotificationService {
    /**
     * Create a stock movement notification
     */
    async createStockMovementNotification(movement, product, user) {
        try {
            const typeLabel = movement.type === 'ENTREE' ? 'Entrée' : 'Sortie';
            const destination = movement.destination ? ` vers ${movement.destination}` : '';

            await Notification.create({
                type: 'STOCK_MOUVEMENT',
                title: `${typeLabel} de stock`,
                message: `${typeLabel} de ${movement.quantite} ${product.unite || 'unités'} de "${product.nom}"${destination}`,
                data: {
                    product_id: product.id,
                    movement_id: movement.id,
                    type: movement.type,
                    quantite: movement.quantite
                },
                priority: 'LOW'
            });
        } catch (error) {
            logger.error(`Error creating stock movement notification: ${error.message}`);
        }
    }

    /**
     * Create stock alert notification
     */
    async createStockAlertNotification(product) {
        try {
            const isRupture = product.statut === 'RUPTURE';

            await Notification.create({
                type: isRupture ? 'STOCK_RUPTURE' : 'STOCK_ALERTE',
                title: isRupture ? 'Rupture de stock' : 'Alerte de stock',
                message: isRupture
                    ? `Le produit "${product.nom}" est en rupture de stock!`
                    : `Le produit "${product.nom}" a atteint le seuil d'alerte (${product.quantite_actuelle}/${product.seuil_alerte})`,
                data: {
                    product_id: product.id,
                    quantite_actuelle: product.quantite_actuelle,
                    seuil_alerte: product.seuil_alerte
                },
                priority: isRupture ? 'HIGH' : 'MEDIUM'
            });
        } catch (error) {
            logger.error(`Error creating stock alert notification: ${error.message}`);
        }
    }

    /**
     * Create salary notification
     */
    async createSalaryNotification(salary, worker, type = 'created') {
        try {
            const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

            const period = `${monthNames[salary.mois - 1]} ${salary.annee}`;

            if (type === 'created') {
                await Notification.create({
                    type: 'SALARY_CREATED',
                    title: 'Salaire créé',
                    message: `Salaire de ${worker.nom} ${worker.prenom} créé pour ${period}`,
                    data: {
                        salary_id: salary.id,
                        worker_id: worker.id,
                        mois: salary.mois,
                        annee: salary.annee
                    },
                    priority: 'LOW'
                });
            } else if (type === 'paid') {
                await Notification.create({
                    type: 'SALARY_PAID',
                    title: 'Salaire payé',
                    message: `Salaire de ${worker.nom} ${worker.prenom} payé pour ${period}`,
                    data: {
                        salary_id: salary.id,
                        worker_id: worker.id,
                        montant: salary.salaire_net
                    },
                    priority: 'LOW'
                });
            }
        } catch (error) {
            logger.error(`Error creating salary notification: ${error.message}`);
        }
    }

    /**
     * Create payment received notification
     */
    async createPaymentNotification(payment, client) {
        try {
            await Notification.create({
                type: 'PAYMENT_RECEIVED',
                title: 'Paiement reçu',
                message: `Paiement de ${payment.montant} FCFA reçu du client "${client.nom}"`,
                data: {
                    payment_id: payment.id,
                    client_id: client.id,
                    montant: payment.montant
                },
                priority: 'LOW'
            });
        } catch (error) {
            logger.error(`Error creating payment notification: ${error.message}`);
        }
    }

    /**
     * Create worker notification
     */
    async createWorkerNotification(worker) {
        try {
            await Notification.create({
                type: 'WORKER_CREATED',
                title: 'Nouveau travailleur',
                message: `Nouveau travailleur ajouté: ${worker.nom} ${worker.prenom} (${worker.poste})`,
                data: {
                    worker_id: worker.id
                },
                priority: 'LOW'
            });
        } catch (error) {
            logger.error(`Error creating worker notification: ${error.message}`);
        }
    }

    /**
     * Create system notification
     */
    async createSystemNotification(title, message, data = {}, userId = null) {
        try {
            await Notification.create({
                user_id: userId,
                type: 'SYSTEM',
                title,
                message,
                data,
                priority: 'MEDIUM'
            });
        } catch (error) {
            logger.error(`Error creating system notification: ${error.message}`);
        }
    }

    /**
     * Get unread count for user
     */
    async getUnreadCount(userId) {
        try {
            const { Op } = require('sequelize');
            return await Notification.count({
                where: {
                    is_read: false,
                    [Op.or]: [
                        { user_id: userId },
                        { user_id: null }
                    ]
                }
            });
        } catch (error) {
            logger.error(`Error getting unread count: ${error.message}`);
            return 0;
        }
    }
}

module.exports = new NotificationService();

const PDFDocument = require('pdfkit');

// Modern color palette
const COLORS = {
    primary: '#059669',      // Emerald-600
    primaryDark: '#047857',  // Emerald-700
    primaryLight: '#D1FAE5', // Emerald-100
    secondary: '#1F2937',    // Gray-800
    text: '#374151',         // Gray-700
    textLight: '#6B7280',    // Gray-500
    textMuted: '#9CA3AF',    // Gray-400
    border: '#E5E7EB',       // Gray-200
    background: '#F9FAFB',   // Gray-50
    white: '#FFFFFF',
    success: '#10B981',      // Emerald-500
    warning: '#F59E0B',      // Amber-500
    error: '#EF4444',        // Red-500
    blue: '#3B82F6',         // Blue-500
    purple: '#8B5CF6',       // Purple-500
};

class PDFService {
    /**
     * Generate modern salary bulletin PDF
     */
    async generateSalaryBulletin(salary) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 0,
                    size: 'A4',
                    bufferPages: true
                });
                const buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                const pageWidth = doc.page.width;
                const pageHeight = doc.page.height;
                const margin = 40;
                const contentWidth = pageWidth - (margin * 2);

                // ============================================
                // HEADER SECTION WITH GRADIENT EFFECT
                // ============================================

                // Header background
                doc.rect(0, 0, pageWidth, 140)
                    .fill(COLORS.primary);

                // Decorative circle pattern
                doc.circle(pageWidth - 60, 70, 80)
                    .fill(COLORS.primaryDark);
                doc.circle(pageWidth - 20, 30, 40)
                    .fill(COLORS.primaryDark);

                // Company name
                doc.fontSize(28).font('Helvetica-Bold')
                    .fillColor(COLORS.white)
                    .text(process.env.COMPANY_NAME || 'SALIHATE CLEAN', margin, 35);

                // Company details
                doc.fontSize(10).font('Helvetica')
                    .fillColor(COLORS.primaryLight)
                    .text(process.env.COMPANY_ADDRESS || 'Casablanca, Maroc', margin, 70)
                    .text(`Tél: ${process.env.COMPANY_PHONE || '+212 5XX-XXXXXX'}`, margin, 85)
                    .text(`Email: ${process.env.COMPANY_EMAIL || 'contact@salihate-clean.ma'}`, margin, 100);

                // ============================================
                // DOCUMENT TITLE BADGE
                // ============================================

                const badgeY = 120;
                const badgeWidth = 220;
                const badgeHeight = 50;
                const badgeX = pageWidth - margin - badgeWidth;

                // Badge background
                doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 8)
                    .fill(COLORS.white);

                // Badge text
                doc.fontSize(14).font('Helvetica-Bold')
                    .fillColor(COLORS.primary)
                    .text('BULLETIN DE PAIE', badgeX, badgeY + 10, { width: badgeWidth, align: 'center' });

                const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

                doc.fontSize(10).font('Helvetica')
                    .fillColor(COLORS.textLight)
                    .text(`${monthNames[salary.mois - 1]} ${salary.annee}`, badgeX, badgeY + 30, { width: badgeWidth, align: 'center' });

                // ============================================
                // EMPLOYEE INFO CARD
                // ============================================

                const worker = salary.worker;
                const cardY = 190;
                const cardHeight = 120;

                // Card shadow effect (subtle)
                doc.roundedRect(margin + 2, cardY + 2, contentWidth, cardHeight, 10)
                    .fill('#E5E7EB');

                // Card background
                doc.roundedRect(margin, cardY, contentWidth, cardHeight, 10)
                    .fill(COLORS.white);

                // Left accent bar
                doc.roundedRect(margin, cardY, 6, cardHeight, 3)
                    .fill(COLORS.primary);

                // Section title
                doc.fontSize(11).font('Helvetica-Bold')
                    .fillColor(COLORS.primary)
                    .text('INFORMATIONS EMPLOYÉ', margin + 25, cardY + 15);

                // Employee details in two columns
                const col1X = margin + 25;
                const col2X = margin + contentWidth / 2;
                let infoY = cardY + 40;

                doc.fontSize(9).font('Helvetica')
                    .fillColor(COLORS.textMuted);

                // Left column
                doc.text('Nom complet', col1X, infoY);
                doc.font('Helvetica-Bold').fillColor(COLORS.secondary)
                    .text(`${worker.prenom} ${worker.nom}`, col1X, infoY + 12);

                doc.font('Helvetica').fillColor(COLORS.textMuted)
                    .text('Poste', col1X, infoY + 35);
                doc.font('Helvetica-Bold').fillColor(COLORS.secondary)
                    .text(worker.poste || 'N/A', col1X, infoY + 47);

                // Right column
                doc.font('Helvetica').fillColor(COLORS.textMuted)
                    .text('Site d\'affectation', col2X, infoY);
                doc.font('Helvetica-Bold').fillColor(COLORS.secondary)
                    .text(worker.site_affectation || 'N/A', col2X, infoY + 12);

                doc.font('Helvetica').fillColor(COLORS.textMuted)
                    .text('CIN', col2X, infoY + 35);
                doc.font('Helvetica-Bold').fillColor(COLORS.secondary)
                    .text(worker.cin || 'N/A', col2X, infoY + 47);

                // ============================================
                // SALARY DETAILS TABLE
                // ============================================

                const tableY = cardY + cardHeight + 30;
                const tableHeaderHeight = 40;

                // Section title
                doc.fontSize(11).font('Helvetica-Bold')
                    .fillColor(COLORS.secondary)
                    .text('DÉTAILS DU SALAIRE', margin, tableY);

                // Table header
                const headerY = tableY + 20;
                doc.roundedRect(margin, headerY, contentWidth, tableHeaderHeight, 6)
                    .fill(COLORS.background);

                doc.fontSize(9).font('Helvetica-Bold')
                    .fillColor(COLORS.textLight)
                    .text('DÉSIGNATION', margin + 15, headerY + 14)
                    .text('MONTANT', pageWidth - margin - 100, headerY + 14, { width: 85, align: 'right' });

                // Table rows
                let rowY = headerY + tableHeaderHeight + 5;
                const rowHeight = 35;

                // Salaire de base
                this._drawModernRow(doc, margin, rowY, contentWidth, rowHeight,
                    'Salaire de base', this._formatMoney(salary.salaire_base), false, null, COLORS);
                rowY += rowHeight;

                // Primes
                if (parseFloat(salary.primes) > 0) {
                    this._drawModernRow(doc, margin, rowY, contentWidth, rowHeight,
                        'Primes', `+${this._formatMoney(salary.primes)}`, false, COLORS.success, COLORS);
                    rowY += rowHeight;

                    // Prime details
                    if (salary.primes_details && salary.primes_details.length > 0) {
                        salary.primes_details.forEach(prime => {
                            this._drawModernRow(doc, margin, rowY, contentWidth, 28,
                                `    • ${prime.label}`, `+${this._formatMoney(prime.amount)}`, true, COLORS.success, COLORS);
                            rowY += 28;
                        });
                    }
                }

                // Déductions
                if (parseFloat(salary.deductions) > 0) {
                    this._drawModernRow(doc, margin, rowY, contentWidth, rowHeight,
                        'Déductions', `-${this._formatMoney(salary.deductions)}`, false, COLORS.error, COLORS);
                    rowY += rowHeight;

                    // Deduction details
                    if (salary.deductions_details && salary.deductions_details.length > 0) {
                        salary.deductions_details.forEach(deduction => {
                            this._drawModernRow(doc, margin, rowY, contentWidth, 28,
                                `    • ${deduction.label}`, `-${this._formatMoney(deduction.amount)}`, true, COLORS.error, COLORS);
                            rowY += 28;
                        });
                    }
                }

                // ============================================
                // NET SALARY BOX
                // ============================================

                rowY += 15;
                const netBoxHeight = 60;

                // Box with gradient effect
                doc.roundedRect(margin, rowY, contentWidth, netBoxHeight, 10)
                    .fill(COLORS.primary);

                // Inner highlight
                doc.roundedRect(margin + 3, rowY + 3, contentWidth - 6, netBoxHeight - 6, 8)
                    .lineWidth(1)
                    .stroke(COLORS.primaryDark);

                doc.fontSize(12).font('Helvetica-Bold')
                    .fillColor(COLORS.primaryLight)
                    .text('SALAIRE NET À PAYER', margin + 20, rowY + 15);

                doc.fontSize(22).font('Helvetica-Bold')
                    .fillColor(COLORS.white)
                    .text(this._formatMoney(salary.salaire_net), pageWidth - margin - 200, rowY + 18, { width: 180, align: 'right' });

                // ============================================
                // PAYMENT INFO (if paid)
                // ============================================

                if (salary.statut === 'PAYE') {
                    rowY += netBoxHeight + 25;

                    // Payment status badge
                    const statusBadgeWidth = 100;
                    doc.roundedRect(margin, rowY, statusBadgeWidth, 28, 5)
                        .fill('#D1FAE5');

                    doc.fontSize(10).font('Helvetica-Bold')
                        .fillColor(COLORS.primary)
                        .text('✓ PAYÉ', margin + 10, rowY + 8);

                    // Payment details
                    const payInfoX = margin + statusBadgeWidth + 20;
                    doc.fontSize(9).font('Helvetica')
                        .fillColor(COLORS.textLight)
                        .text(`Payé le ${this._formatDate(salary.date_paiement)}`, payInfoX, rowY + 5);

                    if (salary.mode_paiement) {
                        doc.text(` • Mode: ${salary.mode_paiement}`, payInfoX + 120, rowY + 5);
                    }
                    if (salary.reference_paiement) {
                        doc.text(`Réf: ${salary.reference_paiement}`, payInfoX, rowY + 18);
                    }
                }

                // ============================================
                // FOOTER
                // ============================================

                // Footer line
                doc.moveTo(margin, pageHeight - 60)
                    .lineTo(pageWidth - margin, pageHeight - 60)
                    .lineWidth(1)
                    .stroke(COLORS.border);

                // Footer text
                doc.fontSize(8).font('Helvetica')
                    .fillColor(COLORS.textMuted)
                    .text(`Document généré le ${this._formatDate(new Date())}`, margin, pageHeight - 45)
                    .text('Ce document est confidentiel', pageWidth - margin - 150, pageHeight - 45, { width: 150, align: 'right' });

                // Company watermark
                doc.fontSize(8).fillColor(COLORS.textMuted)
                    .text(process.env.COMPANY_NAME || 'SALIHATE CLEAN', margin, pageHeight - 30, { width: contentWidth, align: 'center' });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generate modern client receipt PDF
     */
    async generateClientReceipt(client, month, year) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 0,
                    size: 'A4',
                    bufferPages: true
                });
                const buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                const pageWidth = doc.page.width;
                const pageHeight = doc.page.height;
                const margin = 40;
                const contentWidth = pageWidth - (margin * 2);

                // ============================================
                // HEADER SECTION
                // ============================================

                // Header background with purple theme for receipts
                doc.rect(0, 0, pageWidth, 140)
                    .fill(COLORS.purple);

                // Decorative elements
                doc.circle(pageWidth - 50, 60, 70)
                    .fill('#7C3AED');
                doc.circle(pageWidth - 10, 20, 35)
                    .fill('#7C3AED');

                // Company name
                doc.fontSize(28).font('Helvetica-Bold')
                    .fillColor(COLORS.white)
                    .text(process.env.COMPANY_NAME || 'SALIHATE CLEAN', margin, 35);

                // Company details
                doc.fontSize(10).font('Helvetica')
                    .fillColor('#DDD6FE')
                    .text(process.env.COMPANY_ADDRESS || 'Casablanca, Maroc', margin, 70)
                    .text(`Tél: ${process.env.COMPANY_PHONE || '+212 5XX-XXXXXX'}`, margin, 85)
                    .text(`Email: ${process.env.COMPANY_EMAIL || 'contact@salihate-clean.ma'}`, margin, 100);

                // ============================================
                // DOCUMENT TITLE BADGE
                // ============================================

                const badgeY = 120;
                const badgeWidth = 220;
                const badgeHeight = 50;
                const badgeX = pageWidth - margin - badgeWidth;

                doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 8)
                    .fill(COLORS.white);

                doc.fontSize(14).font('Helvetica-Bold')
                    .fillColor(COLORS.purple)
                    .text('REÇU DE PAIEMENT', badgeX, badgeY + 10, { width: badgeWidth, align: 'center' });

                if (month && year) {
                    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                    doc.fontSize(10).font('Helvetica')
                        .fillColor(COLORS.textLight)
                        .text(`${monthNames[parseInt(month) - 1]} ${year}`, badgeX, badgeY + 30, { width: badgeWidth, align: 'center' });
                }

                // Receipt number
                const receiptNum = `REC-${Date.now().toString().slice(-8)}`;
                doc.fontSize(9).font('Helvetica')
                    .fillColor(COLORS.textMuted)
                    .text(`N° ${receiptNum}`, margin, badgeY + 35);

                // ============================================
                // CLIENT INFO CARD
                // ============================================

                const cardY = 190;
                const cardHeight = 100;

                doc.roundedRect(margin + 2, cardY + 2, contentWidth, cardHeight, 10)
                    .fill('#E5E7EB');

                doc.roundedRect(margin, cardY, contentWidth, cardHeight, 10)
                    .fill(COLORS.white);

                doc.roundedRect(margin, cardY, 6, cardHeight, 3)
                    .fill(COLORS.purple);

                doc.fontSize(11).font('Helvetica-Bold')
                    .fillColor(COLORS.purple)
                    .text('INFORMATIONS CLIENT', margin + 25, cardY + 15);

                const col1X = margin + 25;
                const col2X = margin + contentWidth / 2;
                let infoY = cardY + 40;

                doc.fontSize(9).font('Helvetica').fillColor(COLORS.textMuted)
                    .text('Client', col1X, infoY);
                doc.font('Helvetica-Bold').fillColor(COLORS.secondary)
                    .text(client.nom || 'N/A', col1X, infoY + 12);

                doc.font('Helvetica').fillColor(COLORS.textMuted)
                    .text('Site', col2X, infoY);
                doc.font('Helvetica-Bold').fillColor(COLORS.secondary)
                    .text(client.site || 'N/A', col2X, infoY + 12);

                doc.font('Helvetica').fillColor(COLORS.textMuted)
                    .text('Téléphone', col1X, infoY + 35);
                doc.font('Helvetica-Bold').fillColor(COLORS.secondary)
                    .text(client.telephone || 'N/A', col1X, infoY + 47);

                doc.font('Helvetica').fillColor(COLORS.textMuted)
                    .text('Email', col2X, infoY + 35);
                doc.font('Helvetica-Bold').fillColor(COLORS.secondary)
                    .text(client.email || 'N/A', col2X, infoY + 47);

                // ============================================
                // CONTRACT SUMMARY CARDS
                // ============================================

                const summaryY = cardY + cardHeight + 25;
                const summaryCardWidth = (contentWidth - 20) / 3;
                const summaryCardHeight = 70;

                // Contract value card
                this._drawSummaryCard(doc, margin, summaryY, summaryCardWidth, summaryCardHeight,
                    'Valeur du contrat', this._formatMoney(client.prix_contrat), COLORS.blue, COLORS);

                // Amount paid card
                this._drawSummaryCard(doc, margin + summaryCardWidth + 10, summaryY, summaryCardWidth, summaryCardHeight,
                    'Montant payé', this._formatMoney(client.montant_paye), COLORS.success, COLORS);

                // Remaining amount card
                const remaining = parseFloat(client.prix_contrat || 0) - parseFloat(client.montant_paye || 0);
                this._drawSummaryCard(doc, margin + (summaryCardWidth + 10) * 2, summaryY, summaryCardWidth, summaryCardHeight,
                    'Reste à payer', this._formatMoney(remaining), remaining > 0 ? COLORS.warning : COLORS.success, COLORS);

                // ============================================
                // PAYMENTS HISTORY TABLE
                // ============================================

                let tableY = summaryY + summaryCardHeight + 30;

                if (client.payments && client.payments.length > 0) {
                    doc.fontSize(11).font('Helvetica-Bold')
                        .fillColor(COLORS.secondary)
                        .text('HISTORIQUE DES PAIEMENTS', margin, tableY);

                    const headerY = tableY + 20;
                    const tableHeaderHeight = 35;

                    doc.roundedRect(margin, headerY, contentWidth, tableHeaderHeight, 6)
                        .fill(COLORS.background);

                    doc.fontSize(8).font('Helvetica-Bold')
                        .fillColor(COLORS.textLight)
                        .text('DATE', margin + 15, headerY + 12)
                        .text('MODE', margin + 100, headerY + 12)
                        .text('RÉFÉRENCE', margin + 200, headerY + 12)
                        .text('MONTANT', pageWidth - margin - 90, headerY + 12, { width: 75, align: 'right' });

                    let rowY = headerY + tableHeaderHeight + 5;
                    let total = 0;

                    client.payments.forEach((payment, index) => {
                        const isEven = index % 2 === 0;
                        if (isEven) {
                            doc.roundedRect(margin, rowY - 3, contentWidth, 28, 3)
                                .fill('#FAFAFA');
                        }

                        doc.fontSize(9).font('Helvetica')
                            .fillColor(COLORS.text)
                            .text(this._formatDate(payment.date_paiement), margin + 15, rowY + 5)
                            .text(this._formatPaymentMode(payment.mode_paiement), margin + 100, rowY + 5)
                            .text(payment.reference || '-', margin + 200, rowY + 5);

                        doc.font('Helvetica-Bold')
                            .fillColor(COLORS.success)
                            .text(this._formatMoney(payment.montant), pageWidth - margin - 90, rowY + 5, { width: 75, align: 'right' });

                        total += parseFloat(payment.montant);
                        rowY += 28;
                    });

                    // Total row
                    rowY += 10;
                    doc.roundedRect(margin, rowY, contentWidth, 40, 6)
                        .fill(COLORS.purple);

                    doc.fontSize(11).font('Helvetica-Bold')
                        .fillColor(COLORS.white)
                        .text('TOTAL DES PAIEMENTS', margin + 15, rowY + 13);

                    doc.fontSize(14).font('Helvetica-Bold')
                        .fillColor(COLORS.white)
                        .text(this._formatMoney(total), pageWidth - margin - 120, rowY + 11, { width: 100, align: 'right' });

                    tableY = rowY + 50;
                }

                // ============================================
                // SIGNATURE SECTION
                // ============================================

                const signatureY = Math.max(tableY + 30, pageHeight - 180);

                doc.fontSize(9).font('Helvetica')
                    .fillColor(COLORS.textMuted)
                    .text('Signature & Cachet', pageWidth - margin - 150, signatureY);

                doc.roundedRect(pageWidth - margin - 150, signatureY + 15, 150, 60, 5)
                    .lineWidth(1)
                    .dash(3, { space: 3 })
                    .stroke(COLORS.border);

                // ============================================
                // FOOTER
                // ============================================

                doc.moveTo(margin, pageHeight - 60)
                    .lineTo(pageWidth - margin, pageHeight - 60)
                    .lineWidth(1)
                    .undash()
                    .stroke(COLORS.border);

                doc.fontSize(8).font('Helvetica')
                    .fillColor(COLORS.textMuted)
                    .text(`Document généré le ${this._formatDate(new Date())}`, margin, pageHeight - 45)
                    .text('Merci pour votre confiance', pageWidth - margin - 130, pageHeight - 45, { width: 130, align: 'right' });

                doc.fontSize(8).fillColor(COLORS.textMuted)
                    .text(process.env.COMPANY_NAME || 'SALIHATE CLEAN', margin, pageHeight - 30, { width: contentWidth, align: 'center' });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    // Helper methods
    _drawModernRow(doc, x, y, width, height, label, value, isSubItem, valueColor, colors) {
        doc.fontSize(isSubItem ? 8 : 10).font(isSubItem ? 'Helvetica' : 'Helvetica')
            .fillColor(isSubItem ? colors.textLight : colors.text)
            .text(label, x + 15, y + (height / 2) - 5);

        doc.font('Helvetica-Bold')
            .fillColor(valueColor || colors.secondary)
            .text(value, x + width - 115, y + (height / 2) - 5, { width: 100, align: 'right' });

        // Bottom border
        doc.moveTo(x + 15, y + height - 1)
            .lineTo(x + width - 15, y + height - 1)
            .lineWidth(0.5)
            .stroke(colors.border);
    }

    _drawSummaryCard(doc, x, y, width, height, label, value, accentColor, colors) {
        // Card background
        doc.roundedRect(x, y, width, height, 8)
            .fill(colors.white);

        // Top accent
        doc.roundedRect(x, y, width, 4, 2)
            .fill(accentColor);

        // Border
        doc.roundedRect(x, y, width, height, 8)
            .lineWidth(1)
            .stroke(colors.border);

        // Label
        doc.fontSize(8).font('Helvetica')
            .fillColor(colors.textMuted)
            .text(label, x + 10, y + 18, { width: width - 20, align: 'center' });

        // Value
        doc.fontSize(12).font('Helvetica-Bold')
            .fillColor(accentColor)
            .text(value, x + 10, y + 38, { width: width - 20, align: 'center' });
    }

    _formatMoney(amount) {
        const num = parseFloat(amount || 0);
        return `${num.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
    }

    _formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    _formatPaymentMode(mode) {
        const modes = {
            'ESPECES': 'Espèces',
            'VIREMENT': 'Virement',
            'CHEQUE': 'Chèque',
            'CARTE': 'Carte'
        };
        return modes[mode] || mode || 'N/A';
    }
}

module.exports = new PDFService();

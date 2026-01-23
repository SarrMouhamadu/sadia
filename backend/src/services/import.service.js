const xlsx = require('xlsx');
const { Worker, Product, Category } = require('../models');
const { Op } = require('sequelize');

class ImportService {
    /**
     * Parse Excel file and import workers
     * @param {Buffer} fileBuffer - The uploaded file buffer
     * @returns {Promise<Object>} - Import statistics
     */
    async importWorkersFromExcel(fileBuffer) {
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Assuming first sheet
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with array of arrays to handle custom structure
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        let currentSite = 'SIEGE'; // Default site if none specified
        const stats = {
            total: 0,
            created: 0,
            updated: 0,
            errors: []
        };

        // Find header row index (where column names are)
        let headerRowIndex = -1;
        
        // Map to store column indices
        const colMap = {
            prenom: -1,
            nom: -1,
            cin: -1,
            telephone: -1,
            adresse: -1,
            salaire: -1,
            date_naissance: -1
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowStr = row.map(c => String(c).trim().toUpperCase());
            
            // Site Detection Heuristic
            const nonEmptyCells = row.filter(c => c && String(c).trim() !== '');
            if (nonEmptyCells.length === 1) {
                const potentialSite = String(nonEmptyCells[0]).trim();
                // Avoid mistaking headers or other single-cell rows for sites
                // This logic might need tuning based on actual file format
                if (potentialSite.length > 3 && !rowStr.includes('PRENOMS') && !potentialSite.includes('TECHNICIENS DE SURFACE')) {
                    currentSite = potentialSite;
                    console.log(`Switched to site: ${currentSite}`);
                    continue; 
                }
            }

            // Detect Header Row
            if (rowStr.includes('PRENOMS') && rowStr.includes('NOMS')) {
                headerRowIndex = i;
                // Map columns
                rowStr.forEach((colName, idx) => {
                    if (colName.includes('PRENOM')) colMap.prenom = idx;
                    else if (colName === 'NOMS') colMap.nom = idx; 
                    else if (colName.includes('N.I') || colName.includes('CIN')) colMap.cin = idx;
                    else if (colName.includes('TELEPHONE')) colMap.telephone = idx;
                    else if (colName.includes('ADRESSE')) colMap.adresse = idx;
                    else if (colName.includes('SALAIRE')) colMap.salaire = idx;
                    else if (colName.includes('NAISSANCE')) colMap.date_naissance = idx;
                });
                console.log('Header found at row', i, colMap);
                continue;
            }

            // Process Worker Data
            if (headerRowIndex !== -1 && i > headerRowIndex) {
                if (colMap.prenom === -1 || colMap.nom === -1) continue;
                
                const prenom = row[colMap.prenom];
                const nom = row[colMap.nom];

                if (!prenom || !nom) continue;

                // Check for site header inside data rows (redundant check if heuristic above covers it globally, but safe)
                if (nonEmptyCells.length === 1) {
                     const potentialSite = String(nonEmptyCells[0]).trim();
                     if (potentialSite.length > 3) {
                         currentSite = potentialSite;
                         continue;
                     }
                }

                stats.total++;
                
                try {
                    const workerData = {
                        prenom: String(prenom).trim(),
                        nom: String(nom).trim(),
                        poste: 'Technicien de surface',
                        site_affectation: currentSite,
                        statut: 'ACTIF',
                        date_embauche: new Date(), // Set to import date by default
                        date_naissance: colMap.date_naissance !== -1 ? this.parseExcelDate(row[colMap.date_naissance]) : null,
                        email: null,
                    };

                    if (colMap.cin !== -1 && row[colMap.cin]) workerData.cin = String(row[colMap.cin]).trim();
                    if (colMap.telephone !== -1 && row[colMap.telephone]) workerData.contact = String(row[colMap.telephone]).replace(/\s/g, '').trim();
                    if (colMap.adresse !== -1 && row[colMap.adresse]) workerData.adresse = String(row[colMap.adresse]).trim();
                    
                    if (colMap.salaire !== -1 && row[colMap.salaire]) {
                        const salaryStr = String(row[colMap.salaire]).replace(/\s/g, '').replace(',', '.');
                        workerData.salaire_base = parseFloat(salaryStr) || 0;
                    } else {
                        workerData.salaire_base = 0;
                    }

                    // Check if worker exists
                    let existingWorker = null;
                    if (workerData.cin) {
                        existingWorker = await Worker.findOne({ where: { cin: workerData.cin } });
                    }
                    if (!existingWorker && !workerData.cin && workerData.contact) {
                         // Fallback to name match only if strictly necessary, but can be risky. 
                         // Adding contact to make it safer.
                         existingWorker = await Worker.findOne({ 
                             where: { prenom: workerData.prenom, nom: workerData.nom, contact: workerData.contact } 
                         });
                    }

                    if (existingWorker) {
                        await existingWorker.update({
                            site_affectation: workerData.site_affectation,
                            salaire_base: workerData.salaire_base > 0 ? workerData.salaire_base : existingWorker.salaire_base,
                            adresse: workerData.adresse || existingWorker.adresse,
                            contact: workerData.contact || existingWorker.contact,
                            date_naissance: workerData.date_naissance || existingWorker.date_naissance
                        });
                        stats.updated++;
                    } else {
                        await Worker.create(workerData);
                        stats.created++;
                    }
                } catch (err) {
                    console.error('Error importing row:', i, err);
                    stats.errors.push(`Ligne ${i + 1} (${prenom} ${nom}): ${err.message}`);
                }
            }
        }
        
        return stats;
    }

    // Helper to parse Excel date
    parseExcelDate(excelDate) {
        if (!excelDate) return null;
        if (typeof excelDate === 'number') {
            // Excel dates are days since 1900-01-01. JS dates are ms since 1970.
            // 25569 is days between 1900 and 1970
            return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        }
        if (typeof excelDate === 'string') {
            // Try DD/MM/YYYY
            const parts = excelDate.split('/');
            if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
        const d = new Date(excelDate);
        return isNaN(d.getTime()) ? null : d;
    }

    /**
     * Parse Excel file and import products
     * @param {Buffer} fileBuffer - The uploaded file buffer
     * @returns {Promise<Object>} - Import statistics
     */
    async importProductsFromExcel(fileBuffer) {
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        const stats = { total: 0, created: 0, updated: 0, errors: [] };
        
        let headerRowIndex = -1;
        const colMap = { code: -1, nom: -1, categorie: -1, unite: -1, seuil: -1, description: -1 };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowStr = row.map(c => String(c).trim().toUpperCase());

            // Detect Header
            if (rowStr.includes('NOM DU PRODUIT') || (rowStr.includes('CODE') && rowStr.some(c => c.includes('CAT')))) {
                headerRowIndex = i;
                rowStr.forEach((colName, idx) => {
                    if (colName.includes('CODE')) colMap.code = idx;
                    else if (colName.includes('NOM')) colMap.nom = idx;
                    else if (colName.includes('CAT')) colMap.categorie = idx;
                    else if (colName.includes('UNIT')) colMap.unite = idx;
                    else if (colName.includes('SEUIL')) colMap.seuil = idx;
                    else if (colName.includes('DESC')) colMap.description = idx;
                });
                continue;
            }

            if (headerRowIndex !== -1 && i > headerRowIndex) {
                if (colMap.nom === -1) continue;
                
                const nom = row[colMap.nom];
                if (!nom) continue;

                stats.total++;
                try {
                    const productData = {
                        nom: String(nom).trim(),
                        description: colMap.description !== -1 ? String(row[colMap.description]).trim() : null,
                        unite: colMap.unite !== -1 && row[colMap.unite] ? String(row[colMap.unite]).trim() : 'Unité',
                        seuil_alerte: colMap.seuil !== -1 ? (parseInt(row[colMap.seuil]) || 5) : 5,
                        statut: 'OK',
                        quantite_actuelle: 0,
                        code_produit: colMap.code !== -1 && row[colMap.code] ? String(row[colMap.code]).trim() : null
                    };

                    // Handle Category
                    if (colMap.categorie !== -1 && row[colMap.categorie]) {
                        const catName = String(row[colMap.categorie]).trim();
                        let category = await Category.findOne({ where: { nom: catName } });
                        if (!category) {
                            category = await Category.create({ nom: catName, description: 'Importé via Excel' });
                        }
                        productData.category_id = category.id;
                    }

                    // Check existing
                    let existingProduct = null;
                    if (productData.code_produit) existingProduct = await Product.findOne({ where: { code_produit: productData.code_produit } });
                    if (!existingProduct) existingProduct = await Product.findOne({ where: { nom: productData.nom } });

                    if (existingProduct) {
                        await existingProduct.update(productData);
                        stats.updated++;
                    } else {
                        await Product.create(productData);
                        stats.created++;
                    }
                } catch (err) {
                    stats.errors.push(`Ligne ${i + 1} (${nom}): ${err.message}`);
                }
            }
        }
        return stats;
    }
}

module.exports = new ImportService();

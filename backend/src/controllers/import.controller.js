const { asyncHandler, ApiResponse, ApiError } = require('../utils');
const importService = require('../services/import.service');

const importWorkers = asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('Aucun fichier fourni');
    
    const stats = await importService.importWorkersFromExcel(req.file.buffer);
    ApiResponse.success(res, stats, 'Importation terminée');
});

const importProducts = asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('Aucun fichier fourni');
    
    const stats = await importService.importProductsFromExcel(req.file.buffer);
    ApiResponse.success(res, stats, 'Importation terminée');
});

module.exports = {
    importWorkers,
    importProducts
};

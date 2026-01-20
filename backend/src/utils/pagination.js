/**
 * Build pagination object for Sequelize queries
 */
const getPagination = (page, limit) => {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    return {
        limit: Math.min(limitNum, 100), // Max 100 items per page
        offset,
        page: pageNum
    };
};

/**
 * Format pagination response
 */
const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: items } = data;
    const currentPage = page || 1;
    const totalPages = Math.ceil(totalItems / limit);

    return {
        items,
        pagination: {
            totalItems,
            totalPages,
            currentPage,
            itemsPerPage: limit,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1
        }
    };
};

module.exports = {
    getPagination,
    getPagingData
};

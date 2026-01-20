/**
 * Standard API Response helper
 */
class ApiResponse {
    static success(res, data, message = 'Succès', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    static created(res, data, message = 'Ressource créée avec succès') {
        return this.success(res, data, message, 201);
    }

    static paginated(res, data, pagination, message = 'Succès') {
        return res.status(200).json({
            success: true,
            message,
            data,
            pagination
        });
    }

    static noContent(res) {
        return res.status(204).send();
    }

    static error(res, message, statusCode = 400, errors = null) {
        return res.status(statusCode).json({
            success: false,
            message,
            ...(errors && { errors })
        });
    }
}

module.exports = ApiResponse;

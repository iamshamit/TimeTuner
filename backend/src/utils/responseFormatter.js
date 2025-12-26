class ResponseFormatter {
    static success(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    static created(res, data, message = 'Created successfully') {
        return this.success(res, data, message, 201);
    }

    static paginated(res, data, pagination) {
        return res.status(200).json({
            success: true,
            message: 'Success',
            data,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                pages: Math.ceil(pagination.total / pagination.limit),
                hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
                hasPrev: pagination.page > 1
            }
        });
    }

    static noContent(res) {
        return res.status(204).send();
    }
}

module.exports = ResponseFormatter;

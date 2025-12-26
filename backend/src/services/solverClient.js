const axios = require('axios');
const { AppError } = require('../utils/appError');

class SolverClient {
    constructor() {
        this.baseURL = process.env.SOLVER_URL || 'http://localhost:8000';
        this.timeout = parseInt(process.env.SOLVER_TIMEOUT) || 300000;

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async checkHealth() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            throw new AppError('Solver service unavailable', 503);
        }
    }

    async checkReady() {
        try {
            const response = await this.client.get('/ready');
            return response.data;
        } catch (error) {
            throw new AppError('Solver not ready', 503);
        }
    }

    async solve(inputData) {
        try {
            const response = await this.client.post('/api/v1/solve', inputData);
            return response.data;
        } catch (error) {
            if (error.response) {
                throw new AppError(
                    error.response.data.message || 'Solver error',
                    error.response.status
                );
            }
            throw new AppError('Failed to connect to solver', 503);
        }
    }

    async validate(inputData) {
        try {
            const response = await this.client.post('/api/v1/validate', inputData);
            return response.data;
        } catch (error) {
            if (error.response) {
                throw new AppError(error.response.data.message, error.response.status);
            }
            throw new AppError('Failed to validate solver input', 503);
        }
    }
}

module.exports = new SolverClient();

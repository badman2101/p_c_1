import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/complains';

export const complainsApi = {
    async getComplains(params = {}) {
        // params có thể bao gồm: status, type, assigned_to
        const response = await axios.get(BASE_URL, { params });
        return response.data;
    },
    async getComplain(id) {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return response.data;
    },
    async createComplain(data) {
        const response = await axios.post(BASE_URL, data);
        return response.data;
    },
    async updateComplain(id, data) {
        const response = await axios.put(`${BASE_URL}/${id}`, data);
        return response.data;
    },
    async deleteComplain(id) {
        const response = await axios.delete(`${BASE_URL}/${id}`);
        return response.data;
    },
    async assignComplain(id, user_id) {
        const response = await axios.patch(`${BASE_URL}/${id}/assign`, { user_id });
        return response.data;
    },
    async updateStatus(id, status) {
        const response = await axios.patch(`${BASE_URL}/${id}/status`, { status });
        return response.data;
    }
};

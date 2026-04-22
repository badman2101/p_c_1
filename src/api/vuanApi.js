import axios from 'axios';

// const BASE_URL = 'http://localhost:8000/api/vuan';
const BASE_URL = 'https://backend-p-c-1.vercel.app/api/api/vuan';

export const vuanApi = {
    async getVuans(params = {}) {
        const response = await axios.get(BASE_URL, { params });
        return response.data;
    },
    async getVuan(id) {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return response.data;
    },
    async createVuan(data) {
        const response = await axios.post(BASE_URL, data);
        return response.data;
    },
    async updateVuan(id, data) {
        const response = await axios.put(`${BASE_URL}/${id}`, data);
        return response.data;
    },
    async deleteVuan(id) {
        const response = await axios.delete(`${BASE_URL}/${id}`);
        return response.data;
    }
};

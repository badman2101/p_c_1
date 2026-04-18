import axios from 'axios';

// const BASE_URL = 'http://localhost:8000/api/donthu';
const BASE_URL = 'https://backend-p-c-1.vercel.app/api/api/donthu';

export const donthuApi = {
    async getDonThus(params = {}) {
        const response = await axios.get(BASE_URL, { params });
        return response.data;
    },
    async getDonThu(id) {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return response.data;
    },
    async createDonThu(data) {
        const response = await axios.post(BASE_URL, data);
        return response.data;
    },
    async updateDonThu(id, data) {
        const response = await axios.put(`${BASE_URL}/${id}`, data);
        return response.data;
    },
    async deleteDonThu(id) {
        const response = await axios.delete(`${BASE_URL}/${id}`);
        return response.data;
    }
};

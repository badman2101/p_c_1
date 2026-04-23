import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/vuan';
// const BASE_URL = 'https://backend-p-c-1.vercel.app/api/api/vuan';

const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
    };
};

export const vuanApi = {
    async getVuans(params = {}) {
        const response = await axios.get(BASE_URL, { params, headers: getAuthHeaders() });
        return response.data;
    },
    async getVuan(id) {
        const response = await axios.get(`${BASE_URL}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    },
    async createVuan(data) {
        const response = await axios.post(BASE_URL, data, { headers: getAuthHeaders() });
        return response.data;
    },
    async updateVuan(id, data) {
        const response = await axios.put(`${BASE_URL}/${id}`, data, { headers: getAuthHeaders() });
        return response.data;
    },
    async deleteVuan(id) {
        const response = await axios.delete(`${BASE_URL}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    }
};

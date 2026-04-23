import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/donthu';
// const BASE_URL = 'https://backend-p-c-1.vercel.app/api/api/donthu';
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
};

export const donthuApi = {
  async getDonThus(params = {}) {
    const response = await axios.get(BASE_URL, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  },
    async getDonThu(id) {
        const response = await axios.get(`${BASE_URL}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    },
    async createDonThu(data) {
        const response = await axios.post(BASE_URL, data, { headers: getAuthHeaders() });
        return response.data;
    },
    async updateDonThu(id, data) {
        const response = await axios.put(`${BASE_URL}/${id}`, data, { headers: getAuthHeaders() });
        return response.data;
    },
    async deleteDonThu(id) {
        const response = await axios.delete(`${BASE_URL}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    }
};

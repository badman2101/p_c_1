import axios from 'axios';

const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
    };
};

export const donviApi = {
    async getDonvi() {
        const response = await axios.get('http://localhost:8000/api/donvi', { headers: getAuthHeaders() });
        // const response = await axios.get('https://backend-p-c-1.vercel.app/api/api/donvi', { headers: getAuthHeaders() });
        return response.data;
    }   
}
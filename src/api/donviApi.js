import axios from 'axios';

export const donviApi = {
    async getDonvi() {
        const response = await axios.get('http://localhost:8000/api/donvi');
        return response.data;
    }
}

import axios from 'axios';

export const donviApi = {
    async getDonvi() {
        // const response = await axios.get('http://localhost:8000/api/donvi');
        const response = await axios.get('https://backend-p-c-1.vercel.app/api/api/donvi');
        return response.data;
    }   
}

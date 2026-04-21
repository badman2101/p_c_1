import axios from 'axios';

// export const loginApi = {
//     async login(data) {
//         const response = await axios.post('http://localhost:8000/api/login', data);
//         return response.data;
//     }
// }


export const loginApi = {
    async login(data) {
        const response = await axios.post('https://backend-p-c-1.vercel.app/api/api/login', data);
        return response.data;
    }
}
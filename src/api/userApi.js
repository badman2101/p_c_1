import axios from 'axios';

const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
    };
};
                
// export const userApi = {
//     async getUsers() {
//         const response = await axios.get('https://backend-p-c-1.vercel.app/api/api/users', { headers: getAuthHeaders() });
//         return response.data;
//     },
//     async deleteUser(userId) {
//         const response = await axios.delete(`https://backend-p-c-1.vercel.app/api/api/users/${userId}`, { headers: getAuthHeaders() });
//         return response.data;
//     },
//     async updateUser(userId, data) {
//         const response = await axios.put(`https://backend-p-c-1.vercel.app/api/api/users/${userId}`, data, { headers: getAuthHeaders() });
//         return response.data;
//     },
//     async createUser(data) {
//         const response = await axios.post('https://backend-p-c-1.vercel.app/api/api/users', data, { headers: getAuthHeaders() });
//         return response.data;
//     },
//     async getRoleNotUser() {
//         const response = await axios.get('https://backend-p-c-1.vercel.app/api/api/role_not_user', { headers: getAuthHeaders() });
//         return response.data
//     }
// };


export const userApi = {
    async getUsers() {
        const response = await axios.get('http://localhost:8000/api/users', { headers: getAuthHeaders() });
        return response.data;
    },
    async deleteUser(userId) {
        const response = await axios.delete(`http://localhost:8000/api/users/${userId}`, { headers: getAuthHeaders() });
        return response.data;
    },
    async updateUser(userId, data) {
        const response = await axios.put(`http://localhost:8000/api/users/${userId}`, data, { headers: getAuthHeaders() });
        return response.data;
    },
    async createUser(data) {
        const response = await axios.post('http://localhost:8000/api/users', data, { headers: getAuthHeaders() });
        return response.data;
    },
    async getRoleNotUser() {
        const response = await axios.get('http://localhost:8000/api/role_not_user', { headers: getAuthHeaders() });
        return response.data
    },
    async changePassword(data) {
        const response = await axios.post('http://localhost:8000/api/change_password',data,{ headers: getAuthHeaders() });
        return response.data
    },
    // Backward-compatible alias (typo) used in some UI code
    async changePasssword(data) {
        return this.changePassword(data);
    }
};
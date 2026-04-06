import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/nguon_tin';

export const assignmentApi = {
    /**
     * Lấy danh sách phân công có phân trang và tìm kiếm
     * @param {Object} params { page, per_page, q }
     */
    async getAssignments(params = {}) {
        const response = await axios.get(BASE_URL, { params });
        return response.data;
    },

    /**
     * Xem chi tiết phân công
     * @param {Number|String} id 
     */
    async getAssignment(id) {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return response.data;
    },

    /**
     * Tạo mới phân công
     * @param {Object} data { ngay_phan_cong, noi_dung, dieu_tra_vien, ket_qua }
     */
    async createAssignment(data) {
        const response = await axios.post(BASE_URL, data);
        return response.data;
    },

    /**
     * Cập nhật phân công
     * @param {Number|String} id 
     * @param {Object} data Các trường cần cập nhật
     */
    async updateAssignment(id, data) {
        const response = await axios.put(`${BASE_URL}/${id}`, data);
        return response.data;
    },

    /**
     * Xóa phân công
     * @param {Number|String} id 
     */
    async deleteAssignment(id) {
        const response = await axios.delete(`${BASE_URL}/${id}`);
        return response.data;
    }
};

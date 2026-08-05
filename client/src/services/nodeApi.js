import axios from 'axios'

const nodeApi = axios.create({
    baseURL: import.meta.env.VITE_NODE_URL || "http://localhost:5000"
})

nodeApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

nodeApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export const addTransaction = (data) =>
    nodeApi.post('/api/transactions', data)

export const getTransactions = (params) => 
    nodeApi.get('/api/transactions', { params })

export const getSummary = () =>
    nodeApi.get('/api/transactions/summary')

export const deleteTransaction = (id) =>
    nodeApi.delete(`/api/transactions/${id}`)

export const getAdvice = (message) =>
    nodeApi.post('/api/chat/advice', { message })

export default nodeApi

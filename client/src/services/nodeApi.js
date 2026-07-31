import axios from 'axios'

const nodeApi = axios.create({
    baseURL: "http://localhost:5000"
})

nodeApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export const addTransaction = (data) =>
    nodeApi.post('/api/transactions',data)

export const getTransactions = (params) => 
    nodeApi.get('/api/transactions', {params})

export const getSummary = () =>
    nodeApi.get('/api/transactions/summary')

export const deleteTransaction = (id) =>
    nodeApi.delete(`/api/transactions/${id}`)

export default nodeApi

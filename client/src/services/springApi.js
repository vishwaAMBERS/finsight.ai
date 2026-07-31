import axios from 'axios'

const springApi = axios.create({
    baseURL: "http://localhost:9000"
})

springApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export const register = (data) =>
    springApi.post('/api/auth/register', data)

export const login = (data) =>
    springApi.post('/api/auth/login', data)

export const getMe = () =>
    springApi.get('/api/users/me')

export const updateme = (data) =>
    springApi.put('/api/users/me', data)

export default springApi
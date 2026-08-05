import axios from 'axios'

const springApi = axios.create({
    baseURL: import.meta.env.VITE_SPRING_URL || "http://localhost:9000"
})

springApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

springApi.interceptors.response.use(
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

export const register = (data) =>
    springApi.post('/api/auth/register', data)

export const login = (data) =>
    springApi.post('/api/auth/login', data)

export const getMe = () =>
    springApi.get('/api/users/me')

export const updateme = (data) =>
    springApi.put('/api/users/me', data)

export default springApi
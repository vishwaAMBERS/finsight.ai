import { createContext, useContext, useState, useEffect} from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [token , setToken] = useState(localStorage.getItem('token'))
    const [user , setUser] = useState (
        JSON.parse(localStorage.getItem('user') || 'null')
    )

    const loginUser = (tokenValue , userData) => {
        localStorage.setItem('token' , tokenValue)
        localStorage.setItem('user', JSON.stringify(userData))
        setToken(tokenValue)
        setUser(userData)
    }

    const logoutUser = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
    }
    return (
        <AuthContext.Provider value={{ token , user , loginUser, logoutUser}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout as reduxLogout } from '../../../../store/authSlice';
import authService from '../../../../services/auth.service';
import api from '../../../../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const dispatch = useDispatch();
    const { user, token, loading } = useSelector((state) => state.auth);
    const [contextLoading, setContextLoading] = useState(true);

    useEffect(() => {
        const syncSession = async () => {
            if (token && !user) {
                try {
                    const res = await api.get('/auth/status');
                    if (res.data.success) {
                        const { user: backendUser } = res.data.data;
                        const sessionUser = {
                            id: backendUser.id,
                            role: backendUser.role,
                            name: backendUser.name,
                            profileImage: backendUser.profileImage
                        };
                        localStorage.setItem('user', JSON.stringify(sessionUser));
                        dispatch(loginSuccess({ user: sessionUser, token }));
                    } else {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                    }
                } catch (error) {
                    console.error("Failed to decode token/verify session in context", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setContextLoading(false);
        };
        syncSession();
    }, [token, user, dispatch]);

    const login = (newToken, userData) => {
        localStorage.setItem('token', newToken);
        if (userData) {
            const sessionUser = {
                id: userData.id,
                role: userData.role || 'STUDENT',
                name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                email: userData.email,
                profileImage: userData.profileImage
            };
            localStorage.setItem('user', JSON.stringify(sessionUser));
            dispatch(loginSuccess({ user: sessionUser, token: newToken }));
        } else {
            api.get('/auth/status').then(res => {
                if (res.data.success) {
                    const { user: backendUser } = res.data.data;
                    const sessionUser = {
                        id: backendUser.id,
                        role: backendUser.role || 'STUDENT',
                        name: backendUser.name,
                        profileImage: backendUser.profileImage
                    };
                    localStorage.setItem('user', JSON.stringify(sessionUser));
                    dispatch(loginSuccess({ user: sessionUser, token: newToken }));
                }
            }).catch(err => {
                console.error("Failed to retrieve user info on login", err);
            });
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (e) {
            console.error(e);
        } finally {
            dispatch(reduxLogout());
        }
    };

    const mappedUser = user ? {
        id: user.id,
        role: user.role,
        name: user.name,
        profileImage: user.profileImage
    } : null;

    if (contextLoading && loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Syncing session...</p>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user: mappedUser, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

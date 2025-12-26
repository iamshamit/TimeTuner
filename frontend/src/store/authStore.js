import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,

            login: (user, token) => set({
                user,
                accessToken: token,
                isAuthenticated: true
            }),

            logout: () => set({
                user: null,
                accessToken: null,
                isAuthenticated: false
            }),

            updateToken: (token) => set({ accessToken: token }),

            updateUser: (userData) => set((state) => ({
                user: { ...state.user, ...userData }
            })),

            getToken: () => get().accessToken,

            hasRole: (role) => get().user?.role === role,

            hasPermission: (permission) => {
                const user = get().user;
                if (!user) return false;
                if (user.role === 'admin') return true;
                // Add more permission logic as needed
                return false;
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
);

export default useAuthStore;

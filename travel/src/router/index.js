import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/Home.vue')
    },
    {
        path: '/chat',
        name: 'Chat',
        component: () => import('../views/Chat.vue')
    },
    {
        path: '/detail',
        name: 'Detail',
        component: () => import('../views/Detail.vue')
    },

    /* 「我的」及其子路由 */
    {
        path: '/profile',
        children: [
            { path: '', name: 'Profile', component: () => import('../views/Profile.vue') },
            { path: 'favorites', name: 'Favorites', component: () => import('../views/Favorites.vue') },
            { path: 'history', name: 'History', component: () => import('../views/History.vue') },
            { path: 'settings', name: 'Settings', component: () => import('../views/Settings.vue') }
        ]
    },

    /* 「认证」及其子路由 */
    {
        path: '/auth',
        children: [
            { path: 'login', name: 'Login', component: () => import('../views/Login.vue') },
            { path: 'register', name: 'Register', component: () => import('../views/register.vue') }
        ]
    },

    /* 兼容旧路径，自动重定向到子路由 */
    { path: '/login', redirect: { name: 'Login' } },
    { path: '/register', redirect: { name: 'Register' } }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router

import { api } from '../api';
import * as SecureStore from 'expo-secure-store';
import { LoginPayload, RegisterPayload, UserRole } from '../types/auth_types';

export async function Login(payload : LoginPayload){
    const response = await api.post('/auth/login', payload);
    return response.data as { accessToken: string; refreshToken: string };
}

export async function Register(payload: RegisterPayload) {
    const response = await api.post('/auth/register', payload);
    return response.data;
}

export async function storeAuthTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
}

export async function Logout() {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');

    if (accessToken && refreshToken) {
        await api.post('/auth/logout', { refreshToken }, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
    }

    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
}

export function getRoleFromAccessToken(accessToken: string): UserRole {
    const payload = accessToken.split('.')[1];
    const decodedPayload = JSON.parse(decodeBase64Url(payload)) as { role?: UserRole };

    if (!decodedPayload.role) {
        throw new Error('The login response did not include a user role.');
    }

    return decodedPayload.role;
}

function decodeBase64Url(value: string) {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

    if (typeof globalThis.atob !== 'function') {
        throw new Error('This device cannot decode the login response.');
    }

    return globalThis.atob(padded);
}
import { verifyToken, verifyGroups } from './VerifyToken.js';

/**
 * Middleware untuk memverifikasi akses Dinas
 * Hanya user dengan grup Dinas (ID: 1) yang bisa mengakses
 * Digunakan untuk melindungi endpoint yang hanya boleh diakses oleh Dinas
 * 
 * Cara penggunaan di route:
 * router.post('/endpoint', verifyDinas, controller);
 */
export const verifyDinas = [
    verifyToken,
    verifyGroups([1]) // ID 1 adalah grup Dinas
];
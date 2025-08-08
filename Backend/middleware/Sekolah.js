import { verifyToken, verifyGroups } from './VerifyToken.js';

/**
 * Middleware untuk memverifikasi akses Sekolah
 * Hanya user dengan grup Sekolah (ID: 2) yang bisa mengakses
 * Digunakan untuk melindungi endpoint yang hanya boleh diakses oleh Sekolah
 * 
 * Cara penggunaan di route:
 * router.post('/endpoint', verifySekolah, controller);
 */
export const verifySekolah = [
    verifyToken,
    verifyGroups([2]) // ID 2 adalah grup Sekolah
];
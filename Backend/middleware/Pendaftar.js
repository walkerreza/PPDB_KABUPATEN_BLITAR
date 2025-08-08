import { verifyToken, verifyGroups } from "./VerifyToken.js";

/**
 * Middleware untuk memverifikasi akses Pendaftar
 * Hanya user dengan grup Pendaftar (ID: 3) yang bisa mengakses
 * Digunakan untuk melindungi endpoint yang hanya boleh diakses oleh Pendaftar
 * 
 * Cara penggunaan di route:
 * router.post('/endpoint', verifyPendaftar, controller);
 */
export const verifyPendaftar = [
    verifyToken,
    verifyGroups([3]) // ID 3 adalah grup Pendaftar
];
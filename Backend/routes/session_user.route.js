import express from "express";
import { verifyDinas } from "../middleware/Dinas.js";

import {
    createSession,
    getAllSessions,
    getSessionsByUser,
    getActiveSessionsByUser,
    cleanupExpiredSessions,
    deleteSessionById,
    deleteSessionsByUserId
} from "../controllers/session_user.controller.js";

const router = express.Router();

// Membuat session baru
router.post("/", createSession);

// Mendapatkan semua session
router.get("/", verifyDinas, getAllSessions);

// Mendapatkan session berdasarkan ID user
router.get("/user/:id_user", verifyDinas, getSessionsByUser);

// Mendapatkan session aktif berdasarkan ID user
router.get("/active/user/:id_user", verifyDinas, getActiveSessionsByUser);

// Membersihkan session yang expired
router.delete("/cleanup", verifyDinas, cleanupExpiredSessions);

// Menghapus semua session berdasarkan ID user
router.delete("/delete-by-user/:id_user", verifyDinas, deleteSessionsByUserId);

// Menghapus session berdasarkan ID
router.delete("/:id_session_user", verifyDinas, deleteSessionById);

export default router;

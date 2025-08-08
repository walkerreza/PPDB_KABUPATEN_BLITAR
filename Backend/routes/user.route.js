import express from "express";

import {
    getAllUser,
    getUserById,
    getUserByNama,
    createUser,
    updateUser,
    updatePassword,
    deleteUser
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", getAllUser);
router.get("/:id", getUserById);
router.post("/nama", getUserByNama);
router.post("/", createUser);
router.put("/:id", updateUser);
router.put("/password/:id", updatePassword);
router.delete("/:id", deleteUser);

export default router;
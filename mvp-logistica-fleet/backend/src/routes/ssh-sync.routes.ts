import { Router } from "express";
import { simulateSshBackup } from "../services/sshSync.service";

const router = Router();

router.post("/ssh-backup", async (_req, res, next) => {
  try {
    res.status(201).json(await simulateSshBackup());
  } catch (error) {
    next(error);
  }
});

export default router;

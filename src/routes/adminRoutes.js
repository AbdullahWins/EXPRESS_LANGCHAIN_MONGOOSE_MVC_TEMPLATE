const router = require("express").Router();
const { authorizeAdmin } = require("../middlewares/AuthorizeAdmin");

const {
  getOneAdmin,
  getAllAdmins,
  getAdminsByType,
  LoginAdmin,
  RegisterAdmin,
  updateAdminById,
  sendPasswordResetLink,
  updateAdminPasswordByEmail,
  updateAdminPasswordByOldPassword,
  deleteAdminById,
} = require("../controllers/adminController");

router.get("/admins/find/:id", authorizeAdmin, getOneAdmin);
router.get("/admins/all", authorizeAdmin, getAllAdmins);
router.get("/admins/types/:typeName", authorizeAdmin, getAdminsByType);
router.post("/admins/register", RegisterAdmin);
router.post("/admins/login", LoginAdmin);
router.post("/admins/reset", sendPasswordResetLink);
router.patch("/admins/reset", updateAdminPasswordByEmail);
router.patch("/admins/update/:id", authorizeAdmin, updateAdminById);
router.patch("/admins/resetpassword/:email", updateAdminPasswordByOldPassword);
router.delete("/admins/delete/:id", authorizeAdmin, deleteAdminById);

module.exports = router;

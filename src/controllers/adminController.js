// controllers/AdminController.js

const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const { SendEmail } = require("../services/email/SendEmail");
const { uploadMultipleFiles } = require("../utilities/fileUploader");
const { InitiateToken } = require("../services/token/InitiateToken");
const Admin = require("../models/AdminModel");

//login using mongoose
const LoginAdmin = async (req, res) => {
  try {
    const data = JSON.parse(req?.body?.data);
    const { email, password } = data;
    const admin = await Admin.findOne({ email: email }).exec();
    console.log(admin);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    const passwordMatch = await bcrypt.compare(password, admin?.password);
    console.log(passwordMatch);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = InitiateToken(admin?._id, 30);
    return res.json({ token, admin });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//register using mongoose
const RegisterAdmin = async (req, res) => {
  try {
    const { email, password } = JSON.parse(req?.body?.data);

    // Check if the required fields are present in the request
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the admin already exists
    const existingAdminCheck = await Admin.findOne({ email: email }).exec();
    if (existingAdminCheck) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new admin instance
    const newAdmin = new Admin({
      email,
      password: hashedPassword,
    });

    // Save the admin to the database
    await newAdmin.save();

    return res
      .status(201)
      .json({ message: "Admin created successfully", admin: newAdmin });
  } catch (error) {
    console.error("Error creating admin:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

//get all admins using mongoose
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    console.log(`Found ${admins.length} admins`);
    return res.json(admins);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// get admin by types using mongoose
const getAdminsByType = async (req, res) => {
  try {
    const adminTypeName = req?.params?.typeName;
    const admins = await Admin.find({ email: adminTypeName });
    if (admins.length === 0) {
      return res
        .status(404)
        .send({ message: "No admins found for the specified type" });
    } else {
      return res.send(admins);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Server Error" });
  }
};

// get single admin using mongoose
const getOneAdmin = async (req, res) => {
  try {
    const adminId = req?.params?.id;

    //object id validation
    if (!ObjectId.isValid(adminId)) {
      console.log("Invalid ObjectId:", adminId);
      return res.status(400).send({ message: "Invalid ObjectId" });
    }

    //get admin using model
    const admin = await Admin.find({ _id: adminId });

    if (!admin) {
      return res.status(404).send({ message: "Admin not found" });
    } else {
      console.log(admin);
      return res.send(admin);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Server Error" });
  }
};

// update one admin using mongoose
const updateAdminById = async (req, res) => {
  try {
    const id = req?.params?.id;
    // Object ID validation
    if (!ObjectId.isValid(id)) {
      console.log("Invalid ObjectId:", id);
      return res.status(400).send({ message: "Invalid ObjectId" });
    }
    const { files } = req;
    const data = req?.body?.data ? JSON.parse(req?.body?.data) : {};
    const { password, ...additionalData } = data;
    const folderName = "admins";
    let updateData = {};

    if (files?.length > 0) {
      const fileUrls = await uploadMultipleFiles(files, folderName);
      const fileUrl = fileUrls[0];
      updateData = { ...updateData, fileUrl };
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData = { ...updateData, password: hashedPassword };
    }

    if (Object.keys(additionalData).length > 0) {
      updateData = { ...updateData, ...additionalData };
    }
    console.log(updateData);
    const updatedAdmin = await Admin.findOneAndUpdate(
      { _id: id },
      {
        $set: updateData,
      },
      { new: true } // To return the updated document
    );

    return res.json({
      message: "Admin updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("Error updating admin:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// send password reset link to admin using mongoose
const sendPasswordResetLink = async (req, res) => {
  try {
    const data = JSON.parse(req?.body?.data);
    const { email } = data;
    if (email) {
      //send link using model
      const admin = await Admin.findOne({ email: email });
      const receiver = admin?.email;
      if (!receiver) {
        return res.status(401).send({ message: "Admin doesn't exists" });
      } else {
        const subject = "Reset Your Password";
        const text = `Please follow this link to reset your password: ${process.env.ADMIN_PASSWORD_RESET_URL}/${receiver}`;
        const status = await SendEmail(receiver, subject, text);
        if (!status?.code === 200) {
          return res.status(401).send({ message: "Admin doesn't exists" });
        }
        console.log("Password reset link sent to:", receiver);
        return res
          .status(200)
          .send({ message: "Password reset link sent successfully" });
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Failed to reset admin password" });
  }
};

// update one admin password by email using mongoose
const updateAdminPasswordByEmail = async (req, res) => {
  try {
    const data = JSON.parse(req?.body?.data);
    const { email, newPassword } = data;
    let updateData = {};
    if (email && newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData = { password: hashedPassword };
    }

    //update password using model
    const result = await Admin.findOneAndUpdate(
      { email: email },
      {
        $set: updateData,
      },
      { new: true } // To return the updated document
    );
    console.log(result);
    if (result?.modifiedCount === 0) {
      console.log("No modifications were made:", email);
      return res.status(404).send({ message: "No modifications were made!" });
    } else {
      console.log("Password updated for:", email);
      return res.send({ message: "Password updated successfully!" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Failed to reset admin password" });
  }
};

// update one admin password by OldPassword using mongoose
const updateAdminPasswordByOldPassword = async (req, res) => {
  try {
    const email = req?.params?.email;
    const data = JSON.parse(req?.body?.data);
    const admin = await Admin.findOne({ email: email });
    const { oldPassword, newPassword } = data;

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const passwordMatch = await bcrypt.compare(oldPassword, admin?.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await Admin.findOneAndUpdate(
      { email: email },
      {
        $set: { password: hashedPassword },
      },
      { new: true } // To return the updated document
    );
    return res.send({ message: result });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Failed to update admin password" });
  }
};

// delete one admin by id using mongoose
const deleteAdminById = async (req, res) => {
  try {
    const id = req?.params?.id;
    //object id validation
    if (!ObjectId.isValid(id)) {
      console.log("Invalid ObjectId:", id);
      return res.status(400).send({ message: "Invalid ObjectId" });
    }

    //delete using model
    const result = await Admin.deleteOne({ _id: id });
    if (result?.deletedCount === 0) {
      console.log("No admin found to delete with this id:", id);
      return res.send({
        message: `No admin found to delete with this id: ${id} `,
      });
    } else {
      console.log("Admin deleted:", id);
      return res.send({
        message: `Admin deleted successfully with id: ${id} `,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Failed to delete admin" });
  }
};

module.exports = {
  getOneAdmin,
  getAdminsByType,
  getAllAdmins,
  updateAdminById,
  sendPasswordResetLink,
  updateAdminPasswordByEmail,
  RegisterAdmin,
  LoginAdmin,
  updateAdminPasswordByOldPassword,
  deleteAdminById,
};

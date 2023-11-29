// controllers/userController.js

const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const { SendEmail } = require("../services/emails/SendEmail");
const { uploadMultipleFiles } = require("../services/uploaders/fileUploader");
const { InitiateToken } = require("../services/tokens/InitiateToken");
const User = require("../models/UserModel");

//login using mongoose
const LoginUser = async (req, res) => {
  try {
    const data = JSON.parse(req?.body?.data);
    const { email, password } = data;
    const user = await User.findOne({ email: email }).exec();
    console.log(user);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    const passwordMatch = await bcrypt.compare(password, user?.password);
    console.log(passwordMatch);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = InitiateToken(user?._id, 30);
    return res.json({ token, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//register using mongoose
const RegisterUser = async (req, res) => {
  try {
    const { email, password } = JSON.parse(req?.body?.data);

    // Check if the required fields are present in the request
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the user already exists
    const existingUserCheck = await User.findOne({ email: email }).exec();
    if (existingUserCheck) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance
    const newUser = new User({
      email,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    return res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

//get all users using mongoose
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    console.log(`Found ${users.length} users`);
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// get user by types using mongoose
const getUsersByType = async (req, res) => {
  try {
    const userTypeName = req?.params?.typeName;
    const users = await User.find({ email: userTypeName });
    if (users.length === 0) {
      return res
        .status(404)
        .send({ message: "No users found for the specified type" });
    } else {
      return res.send(users);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Server Error" });
  }
};

// get single user using mongoose
const getOneUser = async (req, res) => {
  try {
    const userId = req?.params?.id;

    //object id validation
    if (!ObjectId.isValid(userId)) {
      console.log("Invalid ObjectId:", userId);
      return res.status(400).send({ message: "Invalid ObjectId" });
    }

    //get user using model
    const user = await User.find({ _id: userId });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    } else {
      console.log(user);
      return res.send(user);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Server Error" });
  }
};

// update one user using mongoose
const updateUserById = async (req, res) => {
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
    const folderName = "users";
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
    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      {
        $set: updateData,
      },
      { new: true } // To return the updated document
    );

    return res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// send password reset link to user using mongoose
const sendPasswordResetLink = async (req, res) => {
  try {
    const data = JSON.parse(req?.body?.data);
    const { email } = data;
    if (email) {
      //send link using model
      const user = await User.findOne({ email: email });
      const receiver = user?.email;
      if (!receiver) {
        return res.status(401).send({ message: "User doesn't exists" });
      } else {
        const subject = "Reset Your Password";
        const text = `Please follow this link to reset your password: ${process.env.USER_PASSWORD_RESET_URL}/${receiver}`;
        const status = await SendEmail(receiver, subject, text);
        if (!status?.code === 200) {
          return res.status(401).send({ message: "User doesn't exists" });
        }
        console.log("Password reset link sent to:", receiver);
        return res
          .status(200)
          .send({ message: "Password reset link sent successfully" });
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Failed to reset user password" });
  }
};

// update one user password by email using mongoose
const updateUserPasswordByEmail = async (req, res) => {
  try {
    const data = JSON.parse(req?.body?.data);
    const { email, newPassword } = data;
    let updateData = {};
    if (email && newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData = { password: hashedPassword };
    }

    //update password using model
    const result = await User.findOneAndUpdate(
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
      console.log("password updated for:", email);
      return res.send({ message: "password updated successfully!" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Failed to reset user password" });
  }
};

// update one user password by OldPassword using mongoose
const updateUserPasswordByOldPassword = async (req, res) => {
  try {
    const email = req?.params?.email;
    const data = JSON.parse(req?.body?.data);
    const user = await User.findOne({ email: email });
    const { oldPassword, newPassword } = data;

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user?.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await User.findOneAndUpdate(
      { email: email },
      {
        $set: { password: hashedPassword },
      },
      { new: true } // To return the updated document
    );
    return res.send({ message: result });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Failed to update user password" });
  }
};

// delete one user by id using mongoose
const deleteUserById = async (req, res) => {
  try {
    const id = req?.params?.id;
    //object id validation
    if (!ObjectId.isValid(id)) {
      console.log("Invalid ObjectId:", id);
      return res.status(400).send({ message: "Invalid ObjectId" });
    }

    //delete using model
    const result = await User.deleteOne({ _id: id });
    if (result?.deletedCount === 0) {
      console.log("No user found to delete with this id:", id);
      return res.send({
        message: `No user found to delete with this id: ${id} `,
      });
    } else {
      console.log("User deleted:", id);
      return res.send({ message: `User deleted successfully with id: ${id} ` });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Failed to delete user" });
  }
};

module.exports = {
  getOneUser,
  getUsersByType,
  getAllUsers,
  updateUserById,
  sendPasswordResetLink,
  updateUserPasswordByEmail,
  RegisterUser,
  LoginUser,
  updateUserPasswordByOldPassword,
  deleteUserById,
};

const AccessValidator = (user, userId) => {
  if (user?.role !== "admin") {
    if (user?._doc?._id.toString() !== userId) {
      console.log(user?._doc?._id.toString(), userId);
      console.log("This user does not have access to perform this operation!");
      return false;
    } else {
      console.log(`${user?._doc?.email} is accessing the API!`);
      return true;
    }
  } else {
    console.log("Admin is accessing the API!");
    return true;
  }
};

module.exports = AccessValidator;

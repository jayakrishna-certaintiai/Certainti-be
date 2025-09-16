const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");

const authQueries = require("../queries/auth.queries");
const users = require("../queries/user.queries");

const getUserDetails = async (req, res) => {
    try {
        const { userIds } = req.query;
        let userIdArr = [];
        if(userIds){
          userIdArr = JSON.parse(userIds.replace(/'/g, '"'));
        }
        const data = await users.getPlatformUserDetails(userIdArr);
        return res
          .status(200)
          .json(new ApiResponse(data, "Users fetched successfully."));
      } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
      }
}

const getUserList = async (req, res) => {
    try {
        const data = await users.getPlatformUserList();
        return res
          .status(200)
          .json(
            new ApiResponse(data, "Users list fetched successfully.")
          );
      } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
      }
}

const createUser = async (req, res) =>  {
    try {
        const { user } = req.params;
        let body = {...req.body};
        body.company = JSON.parse(body.company.replace(/'/g, '"'));
        if(!body.email){
          return res.status(422).json(
            new ApiError("Enter email to create a new user", 422)
          )
        }
        let userCheck = await authQueries.ifUserExists(body.email)
        if(userCheck.status){
          return res.status(422).json(
            new ApiError("User with same email exists already", 422)
          )
        }
        const data = await users.createPlatformUser(user, body);
        return res
          .status(201)
          .json(
            new ApiResponse(data, "User Created Successfully")
          );
      } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
      }
}

const deleteUser = async (req, res) =>  {
    try {
        const { company, userId } = req.params;
        const data = await users.deletePlatFormUser(userId);
        return res
          .status(200)
          .json(
            new ApiResponse(data, "platform user deleted successfully.")
          );
      } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
      }
}

const editUser = async ( req, res ) =>  {
  try {

    const { company, user } = req.params;
    let userProfile = req.userProfile;
    const modifiedBy = userProfile.firstName;
    req.body.modifiedBy = modifiedBy;
    const data = await users.editPlatformUserDetails(user, req.body);
    return res
      .status(201)
      .json(
        new ApiResponse(data, "Platform user updated successfully.")
      );
    } catch (error) {
      return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const createRole = async (req, res) =>  {
  try {
      const { company, user } = req.params;
      let body = {...req.body};
      body.createdBy = user;
      body.featurePermissions = JSON.parse(req.body.featurePermissions.replace(/'/g, '"'));
      const data = await authQueries.createNewUserRole(body);
      return res
        .status(201)
        .json(
          new ApiResponse(data, "User Roles Created Successfully")
        );
    } catch (error) {
      return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const getFeaturesAndPermissions = async (req, res) => {
  try {
    const features = await authQueries.getFeaturesList()
    const permissions = await authQueries.getPermissionsList()
    return res.status(200).json(
      new ApiResponse({features, permissions}, "Features and Permissions Data fetched successfully.")
    )
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getRoleInformation = async (req, res) => {
  try {
    const roleDetails = await authQueries.getRoleDetails()
    return res.status(200).json(
      new ApiResponse(roleDetails, "Role Details fetched successfully.")
    )
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

module.exports = {
  getUserDetails,
  getUserList,
  createUser,
  deleteUser,
  editUser,
  createRole,
  getFeaturesAndPermissions,
  getRoleInformation
}
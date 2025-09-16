const { Router } = require("express");
const {
    getUserDetails,
    getUserList,
    createUser,
    deleteUser,
    editUser,
    createRole,
    getFeaturesAndPermissions,
    getRoleInformation
} = require("../controllers/user.controller");
const user = require("../queries/user.queries");

const authorize = require("../middlewares/auth.middleware");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt");

const userRouter = Router();

userRouter.get("/:user/:company/get-user-list", authorize_jwt, getUserList,);
userRouter.get("/:user/:company/get-user-details", authorize_jwt, getUserDetails);
userRouter.post("/:user/:company/create-user", authorize_jwt, createUser);
userRouter.put("/:user/edit-user", authorize_jwt, editUser);
userRouter.delete("/:user/:company/delete-user/:userId", authorize_jwt, deleteUser);
userRouter.post("/:user/:company/create-role", authorize_jwt, createRole);

userRouter.get("/settings/get-features-and-permissions", authorize_jwt, getFeaturesAndPermissions);
userRouter.get("/settings/get-roles-info", authorize_jwt, getRoleInformation);

module.exports = userRouter;

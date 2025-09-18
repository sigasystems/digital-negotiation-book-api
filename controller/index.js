// controllers/index.js

import * as planController from "./planController/planController.js"; // include full path + .js
import * as authController from "./authControllers/auth.controller.js"

// Later you can add more controllers like:
// import * as userController from "./userController.js";
// import * as authController from "./authController.js";

export {
  planController,
  // userController,
  authController,
};

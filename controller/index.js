  // controllers/index.js

  import * as planController from "./planController/plan.controller.js"; // include full path + .js
  import * as authController from "./authControllers/auth.controller.js"
  import * as paymentController from "./paymentController/payment.controller.js"
  import * as businessOwnerController from "./superadminController/sa.businessowner.controller.js"

  // Later you can add more controllers like:
  // import * as userController from "./userController.js";
  // import * as authController from "./authController.js";

  export {
    planController,
    // userController,
    authController,
    paymentController,
    businessOwnerController
  };

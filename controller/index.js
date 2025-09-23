  // controllers/index.js

  import * as planController from "./planController/plan.controller.js"; // include full path + .js
  import * as authController from "./authControllers/auth.controller.js"
  import * as paymentController from "./paymentController/payment.controller.js"
  import * as businessOwnerController from "./superadminController/sa.businessowner.controller.js"
  import * as businessOwnerControllers from "./businessOwnerControllers/businessOwner.controllers.js"
  import * as boBuyersControllers from "./businessOwnerControllers/bo.buyers.controllers.js"
  import * as offerDraftControllers from "./offerControllers/offerDraft.controller.js"

  // Later you can add more controllers like:
  // import * as userController from "./userController.js";
  // import * as authController from "./authController.js";

  export {
    planController,
    // userController,
    authController,
    paymentController,
    businessOwnerController,
    businessOwnerControllers,
    boBuyersControllers,
    offerDraftControllers
  };

import sequelize from "../config/db.js";
import Plan from "./plan.model.js";
import User from "./user.model.js";
import Payment from "./payment.model.js";
import BusinessOwner from "./businessOwner.model.js"
import Buyer from "./buyers.model.js";
import Role from "./roles.model.js";
import OfferDraft from "./offerDraft.model.js";
import Product from "./product.model.js";
import Location from "./location.model.js";
import Offer from "./offer.model.js";
import OfferBuyer from "./OfferBuyer.model.js";
import OfferVersion from "./OfferVersion.model.js";
import OfferResult from "./OfferResult.model.js";
import PasswordResetOtp from "./passwordReset.model.js";
// (If you want associations later, you can add here)
// Example: Plan.hasMany(Subscription);

export {
  sequelize,
  User,
  Plan,
  Payment,
  BusinessOwner,
  Buyer,
  Role,
  OfferDraft,
  Location ,
  Product,
  Offer,
  OfferBuyer,
  OfferVersion,
  OfferResult,
  PasswordResetOtp
};

import { User, Role, BusinessOwner, Buyer } from "../model/index.js";

class UserRepository {
  async findByEmail(email) {
    return await User.findOne({ where: { email } });
  }

  async findByPhone(country_code, phone_number) {
    return await User.findOne({ where: { country_code, phone_number } });
  }

  async createUser(data) {
    return await User.create(data);
  }

  async findRoleById(id) {
    return await Role.findOne({ where: { id } });
  }

  async findBusinessOwnerByUserId(userId) {
    return await BusinessOwner.findOne({ where: { userId } });
  }

  async findBuyerByEmail(email) {
    return await Buyer.findOne({ where: { contactEmail: email } });
  }

  async findById(id) {
    return await User.findOne({ where: { id } });
  }
}

export default new UserRepository();

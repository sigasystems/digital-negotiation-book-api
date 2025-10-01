import { Buyer, BusinessOwner, User } from "../model/index.js";

class BuyerRepository {
  // ===== Buyer CRUD =====
  async findById(id) {
    return Buyer.findByPk(id);
  }

  async findByRegistrationNumber(registrationNumber) {
    return Buyer.findOne({ where: { registrationNumber } });
  }

  async findByContactEmail(contactEmail) {
    return Buyer.findOne({ where: { contactEmail } });
  }

  async create(buyerData) {
    return Buyer.create(buyerData);
  }

  async update(buyer, updates) {
    return buyer.update(updates);
  }

  async softDelete(buyer) {
    return buyer.update({ status: "inactive", isDeleted: true });
  }

  async activate(buyer) {
    return buyer.update({ status: "active", isDeleted: false });
  }

  async deactivate(buyer) {
    return buyer.update({ status: "inactive", isDeleted: false });
  }

  // ===== Buyer Queries =====
  async findAllByOwner(ownerId) {
    return Buyer.findAll({ where: { ownerId } });
  }

  async findByOwnerAndId(ownerId, buyerId) {
    return Buyer.findOne({ where: { id: buyerId, ownerId } });
  }

  async searchBuyers(ownerId, filters) {
    return Buyer.findAll({ where: { ownerId, ...filters } });
  }

  // ===== Business Owner =====
  async findOwnerById(ownerId) {
    return BusinessOwner.findByPk(ownerId);
  }

  async findOwnerByEmail(email) {
    return BusinessOwner.findOne({ where: { email } });
  }

  async createOwner(data) {
    return BusinessOwner.create(data);
  }

  // ===== User =====
  async findUserByEmail(email) {
    return User.findOne({ where: { email } });
  }

  async createUser(userData) {
    return User.create(userData);
  }
}

export default new BuyerRepository();

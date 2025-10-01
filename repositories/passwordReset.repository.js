import PasswordResetOtp from "../model/passwordReset.model.js";

class PasswordResetRepository {
  async createOtp(data) {
    return await PasswordResetOtp.create(data);
  }

  async findLatestOtpByEmail(email) {
    return await PasswordResetOtp.findOne({
      where: { email, used: false },
      order: [["createdAt", "DESC"]],
    });
  }

  async markUsed(record) {
    record.used = true;
    return await record.save();
  }
}

export default new PasswordResetRepository();

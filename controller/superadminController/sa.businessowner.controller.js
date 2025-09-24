import bcrypt from "bcrypt"
import { asyncHandler } from "../../handlers/asyncHandler.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { BusinessOwner, Buyer , User } from "../../model/index.js";
import { businessOwnerSchema } from "../../schemaValidation/businessValidation.js";
import { authorizeRoles } from "../../utlis/authorizeRoles.js";
import formatTimestamps from "../../utlis/formatTimestamps.js";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import transporter from "../../config/nodemailer.js"
import { generateEmailTemplate } from "../../utlis/emailTemplate.js";
import { sendEmailWithRetry } from "../../utlis/emailTemplate.js";
import generateSecurePassword from "../../utlis/genarateSecurePassword.js"
import { emailLoginButton } from "../../utlis/emailLoginButton.js";
import sequelize from "../../config/db.js"

// ------------------ SUPER ADMIN CONTROLLERS ------------------

// Create a new Business Owner
export const createBusinessOwner = asyncHandler(async (req, res) => {
  const t = await sequelize.transaction(); // transaction for atomicity
  try {
    authorizeRoles(req, ["super_admin"]);

    const parsedData = businessOwnerSchema.safeParse(req.body);
    if (!parsedData.success) {
      const errors = parsedData?.error?.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      await t.rollback();
      return errorResponse(res, 400, "Validation Error", errors);
    }

    const { phoneNumber, email, first_name, last_name, businessName } = parsedData.data;
    const contactName = `${first_name || ""} ${last_name || ""}`.trim();
    const phoneObj = parsePhoneNumberFromString(phoneNumber);
    if (!phoneObj || !phoneObj.isValid()) {
      await t.rollback();
      return errorResponse(res, 400, "Invalid mobile number format.");
    }

    const normalizedPhone = phoneObj.number;

    const existingOwner = await BusinessOwner.findOne({ where: { phoneNumber: normalizedPhone } });
    if (existingOwner) {
      await t.rollback();
      return errorResponse(res, 400, "Mobile number already exists. Please use a different one.");
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      await t.rollback();
      return errorResponse(
        res,
        400,
        "Email already exists. Please use a different one."
      );
    }

    // 🔐 Generate secure password and hash
    const plainPassword = generateSecurePassword(12);
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // 1️⃣ Create User
    const user = await User.create(
      {
        email,
        first_name,
        last_name,
        password_hash: passwordHash,
        roleId: 2, // business_owner
      },
      { transaction: t }
    );

    // 2️⃣ Create BusinessOwner linked to this user
    const owner = await BusinessOwner.create(
      { ...parsedData.data, phoneNumber: normalizedPhone, userId: user.id,},
      { transaction: t }
    );

    // 3️⃣ Send welcome email with plain password
    const mailOptions = {
      from: `"Platform Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to the Digital Negotiation Book, ${businessName}!`,
      html: generateEmailTemplate({
        title: `Welcome aboard, ${businessName}! 🎉`,
        subTitle: "Your business owner account has been created successfully.",
        body: `
          <p><b>Business Name:</b> ${businessName}</p>
          <p><b>Email:</b> ${email}</p>
          <p style="font-size: 16px; color: #333;">
            Hello <b>${contactName || email}</b>,
          </p>
          <p><b>Password:</b> ${plainPassword}</p>
          <p><strong><em>Please change your password after first login.</em></strong></p>
          <p>
            ${emailLoginButton({
              url: `${process.env.LOCAL_URL}/login`,
              label: "Log in to Tenant System",
            })}
          </p>
          <p style="font-size: 16px; color: #333;">
            You can now add buyers, manage your locations, and start using the platform.
          </p>
        `,
        footer: "If you did not make this request, please contact support immediately.",
      }),
    };

    const emailResult = await sendEmailWithRetry(transporter, mailOptions, 2);
    if (!emailResult.success) {
      await t.rollback();
      return errorResponse(
        res,
        502,
        "Business owner was created, but email could not be sent after multiple attempts. Please check your email service."
      );
    }

    await t.commit();
    return successResponse(res, 201, "Business owner created successfully", formatTimestamps(owner.toJSON()));
  } catch (err) {
    await t.rollback();
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Get all Business Owners (with optional buyers)
export const getAllBusinessOwners = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const { withBuyers } = req.query;
    let owners;

    if (withBuyers === "true") {
      owners = await BusinessOwner.findAll({
        include: [{ model: Buyer, as: "buyers" }],
      });
    } else {
      owners = await BusinessOwner.findAll();
    }

    const formattedOwners = owners.map((owner) => formatTimestamps(owner.toJSON()));

    return successResponse(res, 200, "Business owners fetched successfully", {
      totalOwners: formattedOwners.length,
      owners: formattedOwners,
    });
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Get Business Owner by ID
export const getBusinessOwnerById = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const owner = await BusinessOwner.findByPk(req.params.id, { paranoid: false });
    if (!owner) return errorResponse(res, 404, "Business owner not found");
    if (owner.is_deleted) return errorResponse(res, 400, "Business owner has been deleted.");

    return successResponse(res, 200, "Business owner fetched successfully", formatTimestamps(owner.toJSON()));
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Update Business Owner
export const updateBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const parsedData = businessOwnerSchema.safeParse(req.body);
    if (!parsedData.success) {
      const errors = parsedData.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return errorResponse(res, 400, "Validation Error", errors);
    }

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");
    if (owner.is_deleted) return errorResponse(res, 400, "Cannot update a deleted business owner");

    const { mobile } = parsedData.data;
    if (mobile) {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(mobile)) {
        return errorResponse(res, 400, "Invalid mobile number format. Must be exactly 10 digits.");
      }

      const existingOwner = await BusinessOwner.findOne({ where: { mobile } });
      if (existingOwner && existingOwner.id !== req.params.id) {
        return errorResponse(res, 400, "Mobile number already exists. Please use a different one.");
      }
    }

    await owner.update(parsedData.data);

    // 📧 Email notification after update
    const mailOptions = {
      from: `"Platform Admin" <${process.env.EMAIL_USER}>`,
      to: owner.email,
      subject: `Your business owner profile has been updated`,
      html: generateEmailTemplate({
        title: `Profile Updated at ${owner.businessName}`,
        subTitle: "Your business owner details have been successfully updated.",
        body: `
          <p><b>Business:</b> ${owner.businessName}</p>
          <p><b>Email:</b> ${owner.email}</p>
          <p style="font-size: 16px; color: #333;">
            Hello <b>${owner.first_name || owner.email}</b>,
          </p>
          <p style="font-size: 16px; color: #333;">
            Your business owner account details have been updated. 
            If you did not request these changes, please contact support immediately.
          </p>
        `,
        footer: "If you did not make this request, please contact support immediately.",
      }),
    };

    const emailResult = await sendEmailWithRetry(transporter, mailOptions, 2);

    if (!emailResult.success) {
      return errorResponse(
        res,
        502,
        "Business owner updated, but email could not be sent after multiple attempts. Please check your email service."
      );
    }

    return successResponse(res, 200, "Business owner updated successfully", formatTimestamps(owner.toJSON()));
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Activate Business Owner
export const activateBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");
    if (owner.is_deleted) return errorResponse(res, 400, "Cannot activate a deleted business owner");
    if (owner.status === "active") return errorResponse(res, 400, "Business owner is already active");

    owner.status = "active";
    owner.is_approved = true;
    await owner.save();

    // 📧 Email notification with login button
    const mailOptions = {
      from: `"Platform Admin" <${process.env.EMAIL_USER}>`,
      to: owner.email,
      subject: `Your business owner account has been activated 🎉`,
      html: generateEmailTemplate({
        title: `Welcome back to the platform, ${owner.businessName}! 🎉`,
        subTitle: "Your business owner account has been activated successfully.",
        body: `
          <p><b>Business:</b> ${owner.businessName}</p>
          <p><b>Email:</b> ${owner.email}</p>
          <p style="font-size: 16px; color: #333;">
            Hello <b>${owner.first_name || owner.email}</b>,
          </p>
          <p style="font-size: 16px; color: #333;">
            Your business owner account has been activated and approved by the platform admin. 
            You now have full access to the platform’s features and can continue managing your business.
          </p>
          <p>
            ${emailLoginButton({
              url: `${process.env.LOCAL_URL}/login`,
              label: "Log in to Platform",
            })}
          </p>
        `,
        footer:
          "If you did not make this request, please contact support immediately.",
      }),
    };

    const emailResult = await sendEmailWithRetry(transporter, mailOptions, 2);

    if (!emailResult.success) {
      return errorResponse(
        res,
        502,
        "Business owner was activated, but email could not be sent after multiple attempts. Please check your email service."
      );
    }

    return successResponse(
      res, 200, "Business owner activated successfully", formatTimestamps(owner.toJSON()));
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Deactivate Business Owner
export const deactivateBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");
    if (owner.is_deleted) return errorResponse(res, 400, "Cannot deactivate a deleted business owner");
    if (owner.status === "inactive") return errorResponse(res, 400, "Business owner is already inactive");

    owner.status = "inactive";
    await owner.save();

    // 📧 Email notification with login button
    const mailOptions = {
      from: `"Platform Admin" <${process.env.EMAIL_USER}>`,
      to: owner.email,
      subject: `Your business owner account has been deactivated`,
      html: generateEmailTemplate({
        title: `Account Deactivated - ${owner.businessName}`,
        subTitle: "Your account has been deactivated by the platform admin.",
        body: `
          <p><b>Business:</b> ${owner.businessName}</p>
          <p><b>Email:</b> ${owner.email}</p>
          <p style="font-size: 16px; color: #333;">
            Hello <b>${owner.first_name || owner.email}</b>,
          </p>
          <p style="font-size: 16px; color: #333;">
            Your business owner account has been deactivated. You will no longer be able to access the platform until reactivated.
          </p>
        `,
        footer:
          "If you did not make this request, please contact support immediately.",
      }),
    };

    const emailResult = await sendEmailWithRetry(transporter, mailOptions, 2);

    if (!emailResult.success) {
      return errorResponse(
        res,
        502,
        "Business owner deactivated, but email could not be sent after multiple attempts. Please check your email service."
      );
    }

    const responseData = {
      id: owner.id,
      first_name: owner.first_name,
      last_name: owner.last_name,
      email: owner.email,
      phoneNumber: owner.phoneNumber,
      status: owner.status,
    };
    return successResponse(res, 200, "Business owner deactivated successfully", responseData);
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Soft Delete Business Owner
export const softDeleteBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const owner = await BusinessOwner.findByPk(req.params.id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");
    if (owner.is_deleted) return errorResponse(res, 400, "Business owner is already deleted.");

    owner.is_deleted = true;
    owner.status = "inactive";
    await owner.save();

    // 📧 Email notification
    const mailOptions = {
      from: `"Platform Admin" <${process.env.EMAIL_USER}>`,
      to: owner.email,
      subject: `Your business owner account has been deleted`,
      html: generateEmailTemplate({
        title: `Account Deleted - ${owner.businessName}`,
        subTitle: "Your business owner account has been soft-deleted.",
        body: `
          <p><b>Business:</b> ${owner.businessName}</p>
          <p><b>Email:</b> ${owner.email}</p>
          <p style="font-size: 16px; color: #333;">
            Hello <b>${owner.first_name || owner.email}</b>,
          </p>
          <p style="font-size: 16px; color: #333;">
            Your business owner account has been deactivated and marked as deleted. 
            You will no longer be able to access the platform unless restored by the admin.
          </p>
        `,
        footer:
          "If you believe this was a mistake, please contact support immediately.",
      }),
    };

    const emailResult = await sendEmailWithRetry(transporter, mailOptions, 2);

    if (!emailResult.success) {
      return errorResponse(
        res,
        502,
        "Business owner was soft-deleted, but email could not be sent after multiple attempts. Please check your email service."
      );
    }

    return successResponse(res, 200, "Business owner soft-deleted successfully", {
      id: owner.id,
      first_name: owner.first_name,
      last_name: owner.last_name,
      email: owner.email,
      phoneNumber: owner.phoneNumber,
      status: owner.status,
      is_deleted: owner.is_deleted,
    });
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});

// Review Business Owner (Approve or Reject)
export const reviewBusinessOwner = asyncHandler(async (req, res) => {
  try {
    authorizeRoles(req, ["super_admin"]);

    const { id } = req.params;
    const { action } = req.query; // ?action=approve OR ?action=reject

    if (!["approve", "reject"].includes(action)) {
      return errorResponse(res, 400, "Invalid action. Use 'approve' or 'reject'.");
    }

    const owner = await BusinessOwner.findByPk(id);
    if (!owner) return errorResponse(res, 404, "Business owner not found");
    if (owner.is_deleted) return errorResponse(res, 400, "Cannot approve/reject a deleted business owner");

    if (owner.is_approved && action === "approve") {
      return errorResponse(res, 400, "Business owner is already approved");
    }

    if (owner.is_approved === false && action === "reject") {
      return errorResponse(res, 400, "Business owner is already rejected");
    }

    owner.is_approved = action === "approve";
    await owner.save();

    // 📧 Email notification with login button
    const mailOptions = {
      from: `"Platform Admin" <${process.env.EMAIL_USER}>`,
      to: owner.email,
      subject: action === "approve"
        ? `Your business owner account has been approved 🎉`
        : `Your business owner account has been rejected`,
      html: generateEmailTemplate({
        title: action === "approve"
          ? `Congratulations, ${owner.businessName}! Your account is approved 🎉`
          : `Account Review Result - ${owner.businessName}`,
        subTitle: action === "approve"
          ? "Your business owner account has been approved by the platform admin."
          : "Your business owner account has been rejected by the platform admin.",
        body: `
          <p><b>Business:</b> ${owner.businessName}</p>
          <p><b>Email:</b> ${owner.email}</p>
          <p style="font-size: 16px; color: #333;">
            Hello <b>${owner.first_name || owner.email}</b>,
          </p>
          <p style="font-size: 16px; color: #333;">
            ${
              action === "approve"
                ? "You can now access all platform features and manage your business."
                : "Your account has been rejected. Please contact support for further information."
            }
          </p>
          <p>
            ${emailLoginButton({
              url: `${process.env.LOCAL_URL}/login`,
              label: "Log in to Platform",
            })}
          </p>
        `,
        footer: "If you did not make this request, please contact support immediately.",
      }),
    };

    const emailResult = await sendEmailWithRetry(transporter, mailOptions, 2);

    if (!emailResult.success) {
      return errorResponse(
        res,
        502,
        `Business owner review completed, but email could not be sent after multiple attempts. Please check your email service.`
      );
    }

    const message = action === "approve"
      ? "Business owner approved successfully"
      : "Business owner rejected successfully";

    const responseData = action === "approve"
      ? formatTimestamps(owner.toJSON())
      : { id: owner.id, first_name: owner.first_name, last_name: owner.last_name, is_approved: owner.is_approved };

    return successResponse(res, 200, message, responseData);
  } catch (err) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }
});


// Approve Business Owner
// export const approveBusinessOwner = asyncHandler(async (req, res) => {
//   try {
//     authorizeRoles(req, ["super_admin"]);

//     const owner = await BusinessOwner.findByPk(req.params.id);
//     if (!owner) return errorResponse(res, 404, "Business owner not found");

//     owner.is_approved = true;
//     await owner.save();

//     return successResponse(res, 200, "Business owner approved successfully", formatTimestamps(owner.toJSON()));
//   } catch (err) {
//     return errorResponse(res, err.statusCode || 500, err.message);
//   }
// });

// // Reject Business Owner
// export const rejectBusinessOwner = asyncHandler(async (req, res) => {
//   try {
//     authorizeRoles(req, ["super_admin"]);

//     const owner = await BusinessOwner.findByPk(req.params.id);
//     if (!owner) return errorResponse(res, 404, "Business owner not found");

//     owner.is_approved = false;
//     await owner.save();

//     return successResponse(res, 200, "Business owner rejected successfully", {
//       id: owner.id,
//       name: owner.name,
//       is_approved: owner.is_approved,
//     });
//   } catch (err) {
//     return errorResponse(res, err.statusCode || 500, err.message);
//   }
// });

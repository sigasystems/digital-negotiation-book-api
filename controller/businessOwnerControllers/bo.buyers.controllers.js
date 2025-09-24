import {buyerSchema} from "../../schemaValidation/buyerValidation.js"
import { Buyer, BusinessOwner } from "../../model/index.js";
import { successResponse, errorResponse } from "../../handlers/responseHandler.js";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import { authorizeRoles } from "../../utlis/authorizeRoles.js";
import transporter from "../../config/nodemailer.js"
import { generateEmailTemplate } from "../../utlis/emailTemplate.js";
import { sendEmailWithRetry } from "../../utlis/emailTemplate.js";

// 1. Add Buyer
export const addBuyer = asyncHandler(async (req, res) => {
  const parsedData = buyerSchema.safeParse(req.body);
  if (!parsedData.success) {
    const errors = parsedData.error.issues.map((i) => i.message);
    return errorResponse(res, 400, errors.join(", "));
  }

   try {
      authorizeRoles(req, ["business_owner"]);
    } catch (err) {
      return errorResponse(res, err.statusCode || 403, err.message);
    }

  const { registrationNumber, contactEmail } = parsedData.data;
  const id = req.user.id
  // Ensure owner exists
  const owner = await BusinessOwner.findByPk(id);
  if (!owner) {
    return errorResponse(res, 404, "Business owner not found");
  }

  // Ensure registration number is unique if provided
  if (registrationNumber) {
    const existingReg = await Buyer.findOne({ where: { registrationNumber } });
    if (existingReg) {
      return errorResponse(res, 409, "Registration number already in use");
    }
  }

  // Ensure contact email is unique
  const existingEmail = await Buyer.findOne({ where: { contactEmail } });
  if (existingEmail) {
    return errorResponse(res, 409, "Contact email already in use");
  }

  const newBuyer = await Buyer.create({
    ...parsedData.data,
    isVerified: true,
  });

   const mailOptions = {
    from: `"${owner?.businessName}" <${process.env.EMAIL_USER}>`,
    to: newBuyer.contactEmail,
    subject: `Buyer added to ${owner?.businessName}`,
    html: generateEmailTemplate({
      title: `Welcome to ${owner?.businessName} 🎉`,
      subTitle: "You have been added as a buyer.",
      body: `
        <p><b>Business:</b> ${owner?.businessName}</p>
        <p><b>Email:</b> ${newBuyer.contactEmail}</p>
        <p style="font-size: 16px; color: #333;">
          Hello <b>${newBuyer.contactName || newBuyer.contactEmail}</b>,
        </p>
        <p style="font-size: 16px; color: #333;">
          You have been added as a buyer to ${owner?.businessName}. You will now receive offers from ${owner?.businessName}.
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
      "Buyer was created, but email could not be sent after multiple attempts. Please check your email service."
    );
  }

  return successResponse(res, 201, "Buyer added successfully", newBuyer);
});

// 2. Soft Delete Buyer
export const deleteBuyer = asyncHandler(async (req, res) => {
   try {
      authorizeRoles(req, ["business_owner"]);
    } catch (err) {
      return errorResponse(res, err.statusCode || 403, err.message);
    }
  const  buyerId  = req.params.id;

  const buyer = await Buyer.findByPk(buyerId);
  if (!buyer) {
    return errorResponse(res, 404, "Buyer not found");
  }

  // Find owner for email details
  const owner = await BusinessOwner.findByPk(buyer.ownerId);
  if (!owner) {
    return errorResponse(res, 404, "Business owner not found for this buyer");
  }

  await buyer.update({ status: "inactive", isDeleted: true });

  // Email details
  const mailOptions = {
    from: `"${owner.businessName}" <${process.env.EMAIL_USER}>`,
    to: buyer.contactEmail,
    subject: `Your buyer account has been deleted`,
    html: generateEmailTemplate({
      title: `Account Deleted from ${owner.businessName}`,
      subTitle: "Your buyer account is no longer active.",
      body: `
        <p><b>Business:</b> ${owner.businessName}</p>
        <p><b>Email:</b> ${buyer.contactEmail}</p>
        <p style="font-size: 16px; color: #333;">
          Hello <b>${buyer.contactName || buyer.contactEmail}</b>,
        </p>
        <p style="font-size: 16px; color: #333;">
          Your buyer account with ${owner.businessName} has been deleted. You will no longer receive offers from ${owner.businessName}.
        </p>
      `,
      footer:
        "If you believe this was a mistake, please contact support immediately.",
    }),
  };

  // Try sending email up to 2 times
  const emailResult = await sendEmailWithRetry(transporter, mailOptions, 2);

  if (!emailResult.success) {
    return errorResponse(
      res,
      502,
      "Buyer was deleted, but email could not be sent after multiple attempts. Please check your email service."
    );
  }

  return successResponse(res, 200, "Buyer deleted successfully");
});

// 3. Activate Buyer
export const activateBuyer = asyncHandler(async (req, res) => {
   try {
      authorizeRoles(req, ["business_owner"]);
    } catch (err) {
      return errorResponse(res, err.statusCode || 403, err.message);
    }
  const { id } = req.params;

  const buyer = await Buyer.findByPk(id);
  if (!buyer) {
    return errorResponse(res, 404, "Buyer not found");
  }

  // Find owner using buyer.ownerId
  const owner = await BusinessOwner.findByPk(buyer.ownerId);
  if (!owner) {
    return errorResponse(res, 404, "Business owner not found for this buyer");
  }

  // Update buyer status
  await buyer.update({ status: "active", isDeleted: false });

  // Prepare email
  const mailOptions = {
    from: `"${owner.businessName}" <${process.env.EMAIL_USER}>`,
    to: buyer.contactEmail,
    subject: `Buyer activated successfully!`,
    html: generateEmailTemplate({
      title: `Buyer activated to ${owner.businessName} 🎉`,
      subTitle: "Your account has been activated!",
      body: `
        <p><b>Business:</b> ${owner.businessName}</p>
        <p><b>Email:</b> ${buyer.contactEmail}</p>
        <p style="font-size: 16px; color: #333;">
          Hello <b>${buyer.contactName || buyer.contactEmail}</b>,
        </p>
        <p style="font-size: 16px; color: #333;">
          You have been activated as a buyer for ${owner.businessName}. You will now receive offers from ${owner.businessName}.
        </p>
      `,
      footer: "If you believe this was a mistake, please contact support immediately.",
    }),
  };

  // Send email with retry
  const emailResult = await sendEmailWithRetry(transporter, mailOptions, 2);

  if (!emailResult.success) {
    return errorResponse(
      res,
      502,
      "Buyer was activated, but email could not be sent after multiple attempts. Please check your email service."
    );
  }

  return successResponse(res, 200, "Buyer activated successfully", buyer);
});

// 4. Deactivate Buyer
export const deactivateBuyer = asyncHandler(async (req, res) => {
   try {
      authorizeRoles(req, ["business_owner"]);
    } catch (err) {
      return errorResponse(res, err.statusCode || 403, err.message);
    }
  const { id } = req.params;

  const buyer = await Buyer.findByPk(id);
  if (!buyer) {
    return errorResponse(res, 404, "Buyer not found");
  }

  // Find owner using buyer.ownerId
  const owner = await BusinessOwner.findByPk(buyer.ownerId);
  if (!owner) {
    return errorResponse(res, 404, "Business owner not found for this buyer");
  }

  // Update buyer status
  await buyer.update({ status: "inactive", isDeleted: false });

  // Prepare email
  const mailOptions = {
    from: `"${owner.businessName}" <${process.env.EMAIL_USER}>`,
    to: buyer.contactEmail,
    subject: `Buyer deactivated`,
    html: generateEmailTemplate({
      title: `Your buyer account at ${owner.businessName} has been deactivated`,
      subTitle: "Your account is now inactive.",
      body: `
        <p><b>Business:</b> ${owner.businessName}</p>
        <p><b>Email:</b> ${buyer.contactEmail}</p>
        <p style="font-size: 16px; color: #333;">
          Hello <b>${buyer.contactName || buyer.contactEmail}</b>,
        </p>
        <p style="font-size: 16px; color: #333;">
          Your buyer account with ${owner.businessName} has been deactivated. You will no longer receive offers from ${owner.businessName}.
        </p>
      `,
      footer: "If you believe this was a mistake, please contact support immediately.",
    }),
  };

  // Send email with retry
  const emailResult = await sendEmailWithRetry(transporter, mailOptions, 2);

  if (!emailResult.success) {
    return errorResponse(
      res,
      502,
      "Buyer was deactivated, but email could not be sent after multiple attempts. Please check your email service."
    );
  }

  return successResponse(res, 200, "Buyer deactivated successfully", buyer);
});

export const editBuyer = asyncHandler(async (req, res) => {
   try {
      authorizeRoles(req, ["business_owner"]);
    } catch (err) {
      return errorResponse(res, err.statusCode || 403, err.message);
    }
  const  id  = req.params.id;

  // Validate partial input
  const parsedData = buyerSchema.safeParse(req.body);
  if (!parsedData.success) {
    const errors = parsedData.error.issues.map((i) => i.message);
    return errorResponse(res, 400, errors.join(", "));
  }

  const updates = parsedData.data;

  // Find buyer
  const buyer = await Buyer.findByPk(id);
  if (!buyer) {
    return errorResponse(res, 404, "Buyer not found");
  }

  // Ensure registration number uniqueness if updating
  if (updates.registrationNumber) {
    const existingReg = await Buyer.findOne({
      where: { registrationNumber: updates.registrationNumber },
    });
    if (existingReg && existingReg.id !== buyer.id) {
      return errorResponse(res, 409, "Registration number already in use");
    }
  }

  // Ensure contact email uniqueness if updating
  if (updates.contactEmail) {
    const existingEmail = await Buyer.findOne({
      where: { contactEmail: updates.contactEmail },
    });
    if (existingEmail && existingEmail.id !== buyer.id) {
      return errorResponse(res, 409, "Contact email already in use");
    }
  }

  // Update buyer
  await buyer.update(updates);

  // 🔗 Get owner info for email
  const owner = await BusinessOwner.findByPk(buyer.ownerId);
  if (!owner) {
    return errorResponse(res, 404, "Business owner not found for this buyer");
  }

  // 📧 Prepare email
  const mailOptions = {
    from: `"${owner.businessName}" <${process.env.EMAIL_USER}>`,
    to: buyer.contactEmail,
    subject: `Your buyer account has been updated`,
    html: generateEmailTemplate({
      title: `Updates to your account at ${owner.businessName}`,
      subTitle: "Your buyer profile has been updated successfully.",
      body: `
        <p><b>Business:</b> ${owner.businessName}</p>
        <p><b>Email:</b> ${buyer.contactEmail}</p>
        <p style="font-size: 16px; color: #333;">
          Hello <b>${buyer.contactName || buyer.contactEmail}</b>,
        </p>
        <p style="font-size: 16px; color: #333;">
          Your buyer account details at ${owner.businessName} have been updated. 
          If you did not request these changes, please contact support immediately.
        </p>
      `,
      footer: "If you believe this was a mistake, please contact support immediately.",
    }),
  };

  // 📩 Send email with retry
  const emailResult = await sendEmailWithRetry(transporter, mailOptions, 2);

  if (!emailResult.success) {
    return errorResponse(
      res,
      502,
      "Buyer was updated, but email could not be sent after multiple attempts. Please check your email service."
    );
  }

  return successResponse(res, 200, "Buyer updated successfully", buyer);
});
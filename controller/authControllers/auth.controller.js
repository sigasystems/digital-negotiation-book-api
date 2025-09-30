import {
  successResponse,
  errorResponse,
} from "../../handlers/responseHandler.js";
import { asyncHandler } from "../../handlers/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, Role, BusinessOwner, Buyer } from "../../model/index.js";
import {
  registerSchemaValidation,
  loginSchemaValidation,
} from "../../schemaValidation/authValidation.js";
import {
  refreshTokenGenerator,
  accessTokenGenerator,
} from "../../utlis/tokenGenerator.js";
import transporter from "../../config/nodemailer.js";
import {
  generateEmailTemplate,
  sendEmailWithRetry,
} from "../../utlis/emailTemplate.js";
import { emailLoginButton } from "../../utlis/emailLoginButton.js";
import PasswordResetOtp from "../../model/passwordReset.model.js";

// Controller to register a new user
export const register = asyncHandler(async (req, res) => {
  // 1. Validate input using Zod
  const parsedData = registerSchemaValidation.safeParse(req.body);
  if (!parsedData.success) {
    const errors = parsedData.error.issues.map((issue) => issue.message);
    return errorResponse(res, 400, errors.join(", "));
  }

  const {
    first_name,
    last_name,
    company_name,
    email,
    country_code,
    phone_number,
    password,
  } = parsedData.data;

  // 2. Check for duplicates
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return errorResponse(res, 409, "User already exists. Kindly login.");
  }

  const existingPhone = await User.findOne({
    where: { country_code, phone_number },
  });
  if (existingPhone) {
    return errorResponse(res, 409, "Phone number already registered.");
  }

  // 3. Hash password securely
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // 4. Store in DB
  const user = await User.create({
    first_name,
    last_name,
    company_name,
    email,
    country_code,
    phone_number,
    password_hash,
  });

  // 5. Respond safely
  return successResponse(res, 201, "User registered successfully!", {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    company_name: user.company_name,
    email: user.email,
    country_code: user.country_code,
    phone_number: user.phone_number,
    created_at: user.created_at,
  });
});

export const login = asyncHandler(async (req, res) => {
  const parsedData = loginSchemaValidation.safeParse(req.body);
  if (!parsedData.success) {
    const errors = parsedData.error.issues.map((issue) => issue.message);
    return errorResponse(res, 400, errors.join(", "));
  }
  const { email, password } = parsedData.data;
  let user = await User.findOne({ where: { email } });
  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      email,
      password_hash: hashedPassword,
      roleId: 6, // guest by default
    });
  } else {
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return errorResponse(res, 401, "Invalid email or password");
    }
  }

  const roleDetails = await Role.findOne({
    where: { id: user.roleId },
    attributes: ["name", "createdAt", "updatedAt", "isActive"],
  });

  const userRoleName = roleDetails?.name || "guest";
  let tokenPayload;
  if (user.roleId === 2) {
    const businessOwner = await BusinessOwner.findOne({
      where: { userId: user.id },
    });
    if (!businessOwner) {
      return errorResponse(
        res,
        404,
        "Business owner record not found for this user"
      );
    }
    if (businessOwner.status === "inactive") {
      return errorResponse(
        res,
        403,
        "Your account is inactive. Please contact support for reactivation."
      );
    }
    const businessOwnerName =
      (user?.first_name || "") + " " + (user?.last_name || "");
    tokenPayload = {
      id: businessOwner.id,
      email: user.email,
      userRole: userRoleName,
      businessName: businessOwner.businessName,
      name: businessOwnerName.trim() || "",
    };
  } else if (user.roleId === 3) {
    const buyer = await Buyer.findOne({ where: { contactEmail: email } });
    if (!buyer) {
      return errorResponse(res, 404, "Buyer record not found for this user");
    }
    tokenPayload = {
      id: buyer.id,
      email: user.email,
      userRole: userRoleName,
      businessName: buyer.buyersCompanyName,
      name: buyer.contactName,
    };
  } else {
    tokenPayload = {
      id: user.id,
      email: user.email,
      userRole: userRoleName,
      businessName: "No business name in DB",
      name: "No name in DB",
    };
  }
  const accessToken = accessTokenGenerator(tokenPayload);
  refreshTokenGenerator(res, tokenPayload);
  return successResponse(res, 200, "Login successful!", {
    accessToken,
    roleCreatedAt: roleDetails?.createdAt || null,
    roleUpdatedAt: roleDetails?.updatedAt || null,
    roleIsActive: roleDetails?.isActive ?? false,
  });
});

export const refreshTokenRotation = asyncHandler(async (req, res) => {
  // 1. Get refresh token from cookie
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return errorResponse(res, 401, "Something went wrong. Please login again.");
  }

  try {
    // 2. Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // 3. Find user in DB
    const user = await User.findOne({ where: { id: decoded.id } });
    if (!user) {
      return errorResponse(
        res,
        401,
        "Something went wrong. Please login again."
      );
    }

    // 4. Generate new access token
    const payload = { id: user.id, email: user.email };
    const accessToken = accessTokenGenerator(payload);

    // 5. Optionally rotate refresh token (more secure)
    refreshTokenGenerator(res, payload);

    // 6. Return new access token
    return successResponse(res, 200, "Access token refreshed successfully!", {
      accessToken,
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    return errorResponse(res, 401, "Something went wrong. Please login again.");
  }
});

// export const resetPassword = asyncHandler(async (req, res) => {
//   // 1. Validate input
//   const parsedData = loginSchemaValidation.safeParse(req.body);
//   if (!parsedData.success) {
//     const errors = parsedData.error.issues.map((issue) => issue.message);
//     return errorResponse(res, 400, errors.join(", "));
//   }

//   const { email, password } = parsedData.data;

//   console.log("Reset request for email:", email);

//   // 2. Check if user exists
//   const user = await User.findOne({ where: { email } });
//   if (!user) {
//     return errorResponse(res, 404, "User does not exist");
//   }

//   // 3. Hash new password
//   const hashedPassword = await bcrypt.hash(password, 10);
//   user.password_hash = hashedPassword;
//   await user.save();

//   // 4. Send confirmation email
//   try {
//   const emailHtml = generateEmailTemplate({
//     title: "Password Reset Successful",
//     subTitle: `Hello ${user.fullName || "User"},`,
//     body: `
//       <p>Your password has been successfully reset. You can now log in using your new password.</p>
//       <p>If this was not you, please contact our support team immediately.</p>
//       ${emailLoginButton({
//         url: "http://localhost:6000/api/auth/login",
//         label: "Login Now",
//       })}
//     `,
//     footer: "This is an automated email. Please do not reply.",
//   });

//   const mailOptions = {
//     from: `"Support Team" <suryadurgesh18@gmail.com>`,
//     to: email,
//     subject: "✅ Password Reset Successful",
//     html: emailHtml,
//   };

//   const result = await sendEmailWithRetry(transporter, mailOptions);

//   if (!result.success) {
//     console.error("Email sending failed:", result.error);
//     return errorResponse(res, 500, "Password updated but email not sent");
//   }
// } catch (err) {
//   console.error("Email sending error:", err);
//   return errorResponse(res, 500, "Password updated but email not sent");
// }

//   // 5. Send success response
//   return successResponse(res, 200, "Password reset successful. Confirmation email sent.", {
//     userId: user.id,
//     email: user.email,
//   });
// });

// Generate random 6-digit OTP

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) return errorResponse(res, 400, "Email is required");

  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Don’t reveal existence of account
    return successResponse(
      res,
      200,
      "If this email is registered, an OTP has been sent."
    );
  }

  // Generate OTP & hash
  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // Save in DB
  await PasswordResetOtp.create({
    email,
    otp: hashedOtp,
    expiresAt,
  });

  // Send email
  const emailHtml = generateEmailTemplate({
    title: "Password Reset OTP",
    subTitle: `Hello ${user.fullName || "User"},`,
    body: `
      <p>Your password reset OTP is:</p>
      <h2 style="letter-spacing: 4px;">${otp}</h2>
      <p>This code will expire in 10 minutes.</p>
    `,
    footer: "If you didn’t request this, ignore this email.",
  });

  const mailOptions = {
    from: `"Support Team" <noreply@yourapp.com>`,
    to: email,
    subject: "🔑 Password Reset OTP",
    html: emailHtml,
  };

  await sendEmailWithRetry(transporter, mailOptions);

  return successResponse(res, 200, "OTP sent to your email.");
});

/**
 * Step 2: Verify OTP and reset password
 */
export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return errorResponse(res, 400, "Email, OTP and new password are required");
  }

  const record = await PasswordResetOtp.findOne({
    where: { email, used: false },
    order: [["createdAt", "DESC"]],
  });

  if (!record) return errorResponse(res, 400, "Invalid or expired OTP");

  if (new Date(record.expiresAt) < new Date()) {
    return errorResponse(res, 400, "OTP has expired");
  }

  const isMatch = await bcrypt.compare(otp, record.otp);
  if (!isMatch) return errorResponse(res, 400, "Invalid OTP");

  // Update password
  const user = await User.findOne({ where: { email } });
  if (!user) return errorResponse(res, 404, "User not found");

  const hashedPassword = await bcrypt.hash(password, 10);
  user.password_hash = hashedPassword;
  await user.save();

  // Mark OTP as used
  record.used = true;
  await record.save();

  // Send confirmation email
  const emailHtml = generateEmailTemplate({
    title: "Password Reset Successful",
    subTitle: `Hello ${user.fullName || "User"},`,
    body: `
      <p>Your password has been successfully reset.</p>
      <p>If this wasn’t you, please contact support immediately.</p>
      ${emailLoginButton({
        url: "http://localhost:6000/api/auth/login",
        label: "Login Now",
      })}
    `,
    footer: "This is an automated email. Please do not reply.",
  });

  await sendEmailWithRetry(transporter, {
    from: `"Support Team" <noreply@yourapp.com>`,
    to: email,
    subject: "✅ Password Reset Successful",
    html: emailHtml,
  });

  return successResponse(res, 200, "Password reset successful.");
});

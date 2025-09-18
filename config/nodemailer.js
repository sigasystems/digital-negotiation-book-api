import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: 'suryadurgesh18@gmail.com',
    pass: 'rrezrvaceqjrrjnd',
  },
});

export default transporter;

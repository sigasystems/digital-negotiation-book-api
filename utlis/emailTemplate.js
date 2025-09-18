/**
 * Generate reusable email templates
 * 
 * @param {Object} options
 * @param {string} options.title - Main heading
 * @param {string} options.subTitle - Sub heading or short intro
 * @param {string} options.body - Main content in HTML
 * @param {string} [options.footer] - Footer note (optional)
 * @returns {string} HTML email content
 */
export const generateEmailTemplate = ({ title, subTitle, body, footer }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f4f4f4;
          padding: 20px;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h2 {
          color: #2c3e50;
          margin-bottom: 10px;
        }
        p {
          line-height: 1.6;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>${title}</h2>
        <p><b>${subTitle}</b></p>
        <div>${body}</div>
        ${
          footer
            ? `<div class="footer">
                <p>${footer}</p>
              </div>`
            : ""
        }
      </div>
    </body>
    </html>
  `;
};

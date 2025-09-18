export const emailLoginButton = ({ url, label }) => `
  <a 
    href="${url}" 
    style="
      display:inline-block;
      padding:10px 18px;
      margin-top:8px;
      background-color:#4f46e5;
      color:#ffffff;
      text-decoration:none;
      border-radius:6px;
      font-weight:600;
    "
  >
    ${label}
  </a>
`;

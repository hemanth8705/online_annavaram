import React from 'react';

const ErrorMessage = ({ title = 'Something went wrong', message, action }) => (
  <div className="error-state" role="alert">
    <h3>{title}</h3>
    {message && <p>{message}</p>}
    {action}
  </div>
);

export default ErrorMessage;

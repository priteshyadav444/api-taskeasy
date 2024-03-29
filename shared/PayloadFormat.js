const getErrorPayload = function getErrorPayload(
  code,
  message,
  status_code = 400,
  error_details = null
) {
  const payload = {
    errors: [
      {
        error_code: code,
        msg: message,
        status_code,
        error_details,
      },
    ],
  };
  return payload;
};

const getSuccessPayload = function getSuccessPayload(
  success_code,
  successMessage,
  status_code,
  payloadData = null
) {
  const payload = {
    success: [
      {
        success_code,
        msg: successMessage,
        status_code,
        data: payloadData,
      },
    ],
  };
  return payload;
};

module.exports = { getErrorPayload, getSuccessPayload };

const getErrorPayload = function getErrorPayload(
  code,
  errorMessage,
  status_code,
  errorDetails = null
) {
  const payload = {
    errors: [
      {
        error_code: code,
        msg: errorMessage,
        status_code,
        errorDetails,
      },
    ],
  };
  return payload;
};

const getSuccessPayload = function getErrorPayload(
  successMessage,
  status_code,
  payloadData = null
) {
  const payload = {
    errors: [
      {
        msg: successMessage,
        status_code,
        data: payloadData,
      },
    ],
  };
  return payload;
};

module.exports = { getErrorPayload, getSuccessPayload };

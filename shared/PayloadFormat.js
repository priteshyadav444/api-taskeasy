const getErrorPayload = function getErrorPayload(
  errorMessage,
  status_code,
  errorDetails = null
) {
  const payload = {
    errors: [
      {
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

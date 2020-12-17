import axios, { AxiosRequestConfig } from "axios";

const client = axios.create();

// Wrapper for axios' requests.
export const httpGetRequest = function (options) {
  const onSuccess = function (response) {
    return response.data;
  };
  const onError = function (error) {
    return Promise.reject(error.response || error.message);
  };

  return client(options).then(onSuccess).catch(onError);
};

// Wrapper for axios' requests.
export const httpPostRequest = function (url, requestBody = null) {
  const onSuccess = function (response) {
    return response.data;
  };
  const onError = function (error) {
    return Promise.reject(error.response || error.message);
  };

  return client.post(url, requestBody).then(onSuccess).catch(onError);
};

// Wrapper for axios put requests.
export const httpPutRequest = function (options, data) {
  const onSuccess = function (response) {
    return response.data;
  };
  const onError = function (error) {
    return Promise.reject(error.response || error.message);
  };

  return client.put(options, data).then(onSuccess).catch(onError);
};

// Wrapper for axios put requests.
export const httpDeleteRequest = function (options) {
  const onSuccess = function (response) {
    return response.data;
  };
  const onError = function (error) {
    return Promise.reject(error.response || error.message);
  };

  return client(options).then(onSuccess).catch(onError);
};

export default {
  httpGetRequest,
  httpPostRequest,
  httpPutRequest,
};

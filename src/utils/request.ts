import axios, { AxiosRequestConfig } from 'axios';

const instance = axios.create({
  timeout: 60000,
});

instance.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err),
);

export function get<T = any>(
  url: string,
  params?: any,
  config: AxiosRequestConfig = {},
): Promise<T> {
  return instance.get(url, { params, ...config });
}

export function post<T = any>(
  url: string,
  body?: any,
  config: AxiosRequestConfig = {},
): Promise<T> {
  return instance.post(url, body, config);
}

const request = {
  get,
  post,
};
export default request;

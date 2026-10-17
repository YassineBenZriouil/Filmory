import { toast } from "react-toastify";

export const customToast = (message, type = "default", options = {}) => {
    toast(message, { type, ...options });
};

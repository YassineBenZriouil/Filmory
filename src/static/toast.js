import { toast } from "react-toastify";

export const customToast = (message, type = "default") => {
    toast(message, { type });
};

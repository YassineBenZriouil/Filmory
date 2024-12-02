import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const customToast = (message, type = "default") => {
    toast(message, { type });
};

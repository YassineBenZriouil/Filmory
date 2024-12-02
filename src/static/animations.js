import React from "react";
import { motion } from "framer-motion";

const animations = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
};

const Animations = ({ children }) => {
    return (
        <motion.div
            className="relative"
            variants={animations}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ width: "100%", position: "relative" }}
        >
            {children}
        </motion.div>
    );
};

export default Animations;
